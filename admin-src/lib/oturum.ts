'use client';

/**
 * Panel oturumu — Supabase kimlik doğrulaması.
 *
 * Giriş gerçek: e-posta ve şifre Supabase'e sorulur. Girişten sonra
 * profiles tablosundan rol okunur ve yalnızca `role = 'admin'` olan
 * hesaplar panele alınır. Bu, veritabanındaki `is_admin()` yardımcısının
 * baktığı alanın aynısıdır; panel kendi yetki kuralını uydurmaz.
 *
 * Buradaki denetim yalnızca arayüzü gizler. Asıl koruma RLS'tedir:
 * admin olmayan bir hesap panelin adresini açsa bile veriyi göremez.
 */

import { supabase, supabaseHazir, type YoneticiProfili } from './supabase';

export type GirisSonucu =
  | { ok: true; profil: YoneticiProfili }
  | { ok: false; hata: string };

/** Supabase'in İngilizce hata metinlerini Türkçeye çevirir. */
function hataMetni(mesaj: string): string {
  const m = mesaj.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-posta ya da şifre hatalı.';
  if (m.includes('email not confirmed')) return 'E-posta adresiniz henüz doğrulanmamış.';
  if (m.includes('too many requests') || m.includes('rate limit')) {
    return 'Çok fazla deneme yapıldı. Bir süre sonra tekrar deneyin.';
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.';
  }
  return 'Giriş yapılamadı. Lütfen tekrar deneyin.';
}

/** Oturum açmış kullanıcının profilini getirir; yoksa null. */
export async function profiliGetir(): Promise<YoneticiProfili | null> {
  if (!supabase) return null;

  const { data: oturum } = await supabase.auth.getSession();
  const kullanici = oturum.session?.user;
  if (!kullanici) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, status')
    .eq('id', kullanici.id)
    .single();

  if (error || !data) return null;
  return data as YoneticiProfili;
}

/** E-posta ve şifreyle giriş yapar, ardından yönetici yetkisini doğrular. */
export async function girisYap(eposta: string, sifre: string): Promise<GirisSonucu> {
  if (!supabase) {
    return { ok: false, hata: 'Panel yapılandırılmamış: Supabase bağlantı bilgileri eksik.' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: eposta,
    password: sifre,
  });
  if (error) return { ok: false, hata: hataMetni(error.message) };

  const profil = await profiliGetir();
  if (!profil) {
    await supabase.auth.signOut();
    return { ok: false, hata: 'Hesap profili okunamadı. Destek ile iletişime geçin.' };
  }

  // Yetkisiz hesabı içeride tutma: oturumu hemen kapat.
  if (profil.role !== 'admin') {
    await supabase.auth.signOut();
    return { ok: false, hata: 'Bu hesabın yönetim paneline erişim yetkisi yok.' };
  }
  if (profil.status !== 'active') {
    await supabase.auth.signOut();
    return { ok: false, hata: 'Bu hesap askıya alınmış.' };
  }

  return { ok: true, profil };
}

export async function cikisYap(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Yapılandırma eksikse giriş ekranı bunu söylemeli. */
export const yapilandirmaEksik = !supabaseHazir;
