'use client';

/**
 * Veritabanı erişimi.
 *
 * Tüm istekler giriş yapan yöneticinin oturumuyla, anon public anahtar
 * üzerinden gider. Yetki RLS'te: politikalar `is_admin()` gördüğü için
 * yönetici tüm satırları okur. Panel kendi yetki kuralını uydurmaz ve
 * `service_role` kullanmaz.
 *
 * YAZMA İŞLEMLERİ — RLS'in izin verdikleri:
 *   reports    update  → is_admin()                     ✅
 *   listings   update  → is_admin()                     ✅
 *   profiles   update  → is_admin()                     ✅
 *   audit_log  insert  → is_admin()                     ✅
 *
 * İzin VERMEDİKLERİ (arayüzde devre dışı, migration gerekiyor):
 *   profiles  delete        → politika yok
 *   match_ratings update    → with check yalnızca is_team_member kabul eder
 */

import { supabase } from './supabase';
import type {
  AuditLog,
  Listing,
  Match,
  MatchRating,
  Profile,
  Report,
  Team,
  TeamMember,
} from './tipler';

function istemci() {
  if (!supabase) throw new Error('Supabase yapılandırılmamış.');
  return supabase;
}

/** Supabase hatasını Türkçe, kullanıcıya gösterilebilir metne çevirir. */
export function hataMetni(e: unknown): string {
  const mesaj = e instanceof Error ? e.message : String(e);
  const m = mesaj.toLowerCase();
  if (m.includes('jwt') || m.includes('expired')) return 'Oturum süresi doldu. Yeniden giriş yapın.';
  if (m.includes('row-level security') || m.includes('violates')) {
    return 'Bu işlem için yetkiniz yok.';
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edin.';
  }
  return mesaj;
}

/* -------------------------------------------------------------------------- */
/* Okuma                                                                      */
/* -------------------------------------------------------------------------- */

export type PanelVerisi = {
  profiller: Profile[];
  takimlar: Team[];
  ilanlar: Listing[];
  maclar: Match[];
  degerlendirmeler: MatchRating[];
  sikayetler: Report[];
  kayitlar: AuditLog[];
  uyeler: TeamMember[];
};

/**
 * Panelin ihtiyaç duyduğu tabloları tek seferde çeker.
 * Veri kümesi küçük (tek şehir, birkaç yüz satır); sayfalama yerine
 * tümünü alıp bellekte filtrelemek hem basit hem yeterli.
 */
export async function panelVerisiniGetir(): Promise<PanelVerisi> {
  const db = istemci();

  const [profiller, takimlar, ilanlar, maclar, degerlendirmeler, sikayetler, kayitlar, uyeler] =
    await Promise.all([
      db.from('profiles').select('*').order('created_at', { ascending: false }),
      db.from('teams').select('*').order('created_at', { ascending: false }),
      db.from('listings').select('*').order('created_at', { ascending: false }).limit(500),
      db.from('matches').select('*').order('starts_at', { ascending: false }).limit(500),
      db.from('match_ratings').select('*').order('created_at', { ascending: false }).limit(500),
      db.from('reports').select('*').order('created_at', { ascending: false }).limit(500),
      db.from('audit_log').select('*').order('created_at', { ascending: false }).limit(300),
      db.from('team_members').select('*'),
    ]);

  const ilkHata = [profiller, takimlar, ilanlar, maclar, degerlendirmeler, sikayetler, kayitlar, uyeler]
    .map((s) => s.error)
    .find(Boolean);
  if (ilkHata) throw new Error(ilkHata.message);

  return {
    profiller: (profiller.data ?? []) as Profile[],
    takimlar: (takimlar.data ?? []) as Team[],
    ilanlar: (ilanlar.data ?? []) as Listing[],
    maclar: (maclar.data ?? []) as Match[],
    degerlendirmeler: (degerlendirmeler.data ?? []) as MatchRating[],
    sikayetler: (sikayetler.data ?? []) as Report[],
    kayitlar: (kayitlar.data ?? []) as AuditLog[],
    uyeler: (uyeler.data ?? []) as TeamMember[],
  };
}

/* -------------------------------------------------------------------------- */
/* İşlem kaydı                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Her yönetim işlemi audit_log'a düşer. Kayıt atılamazsa işlem de
 * başarısız sayılır: gerekçesi kaydedilmemiş bir yaptırım istenmez.
 */
export async function kayitEkle(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  note?: string,
): Promise<AuditLog> {
  const db = istemci();
  const { data, error } = await db
    .from('audit_log')
    .insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      note: note?.trim() || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as AuditLog;
}

/* -------------------------------------------------------------------------- */
/* Yazma işlemleri                                                            */
/* -------------------------------------------------------------------------- */

export async function sikayetiSonuclandir(
  id: string,
  durum: 'resolved' | 'dismissed',
  sonuc: string,
  adminId: string,
): Promise<Report> {
  const db = istemci();
  const { data, error } = await db
    .from('reports')
    .update({
      status: durum,
      resolved_by: adminId,
      resolved_at: new Date().toISOString(),
      resolution: sonuc,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Report;
}

/** İlanı yayından kaldırır. Satır silinmez; geçmiş ve şikayet bağı korunur. */
export async function ilaniKapat(id: string): Promise<Listing> {
  const db = istemci();
  const { data, error } = await db
    .from('listings')
    .update({ is_open: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Listing;
}

export async function kullaniciDurumunuDegistir(
  id: string,
  durum: 'active' | 'suspended',
  sebep?: string,
): Promise<Profile> {
  const db = istemci();
  const { data, error } = await db
    .from('profiles')
    .update(
      durum === 'suspended'
        ? { status: durum, suspended_reason: sebep ?? null, suspended_at: new Date().toISOString() }
        : { status: durum, suspended_reason: null, suspended_at: null },
    )
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Profile;
}

export async function kullaniciRolunuDegistir(id: string, rol: 'user' | 'admin'): Promise<Profile> {
  const db = istemci();
  const { data, error } = await db
    .from('profiles')
    .update({ role: rol })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Profile;
}
