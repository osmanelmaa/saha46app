'use client';

/**
 * Panelin tüm durumu burada tutulur.
 *
 * Veri sahtedir ve yalnızca bellekte yaşar: onayla / reddet / askıya al
 * gerçekten listeleri günceller, ama sayfa yenilenince başlangıç durumuna
 * döner. Sunucu bağlandığında bu dosyadaki işlevlerin gövdesi API
 * çağrılarıyla değiştirilecek, ekranlar aynı kalacak.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type {
  Announcement,
  AuditLog,
  Listing,
  Match,
  Profile,
  Report,
  Team,
  Tournament,
  TournamentApplication,
} from './tipler';
import { baslangicVerisi, YONETICI } from './mock/veri';
import { BUGUN } from './mock/sabitler';

type Durum = {
  takimlar: Team[];
  profiller: Profile[];
  ilanlar: Listing[];
  maclar: Match[];
  sikayetler: Report[];
  turnuvalar: Tournament[];
  basvurular: TournamentApplication[];
  kayitlar: AuditLog[];
  duyurular: Announcement[];
};

type Eylemler = {
  /** Şikayeti sonuçlandırır. */
  sikayetiCoz: (id: string, sonuc: string, not: string) => void;
  sikayetiReddet: (id: string, not: string) => void;
  ilaniKaldir: (id: string, sebep: string) => void;
  kullaniciAskiyaAl: (id: string, sebep: string) => void;
  kullaniciAskisiniKaldir: (id: string) => void;
  kullaniciSil: (id: string, not: string) => void;
  uyariGonder: (hedefTur: string, hedefId: string, not: string) => void;
  ilanKisiti: (takimId: string, not: string) => void;
  gelmemeyiGecersizSay: (macId: string, not: string) => void;
  basvuruKarari: (id: string, karar: 'accepted' | 'rejected', not: string) => void;
  turnuvaEkle: (turnuva: Omit<Tournament, 'id' | 'createdAt' | 'status'>) => void;
  duyuruGonder: (duyuru: Omit<Announcement, 'id' | 'createdAt'>) => void;
};

const Baglam = createContext<(Durum & Eylemler) | null>(null);

let kayitSayaci = 1000;

export function VeriSaglayici({ children }: { children: ReactNode }) {
  const [durum, setDurum] = useState<Durum>(() => ({
    takimlar: [...baslangicVerisi.takimlar],
    profiller: [...baslangicVerisi.profiller],
    ilanlar: [...baslangicVerisi.ilanlar],
    maclar: [...baslangicVerisi.maclar],
    sikayetler: [...baslangicVerisi.sikayetler],
    turnuvalar: [...baslangicVerisi.turnuvalar],
    basvurular: [...baslangicVerisi.basvurular],
    kayitlar: [...baslangicVerisi.kayitlar],
    duyurular: [...baslangicVerisi.duyurular],
  }));

  /** Her işlem, işlem kaydına bir satır düşer. */
  const kaydet = useCallback(
    (d: Durum, action: string, targetType: string, targetId: string, note?: string): Durum => {
      const kayit: AuditLog = {
        id: `l${kayitSayaci++}`,
        adminId: YONETICI.id,
        adminName: YONETICI.name,
        action,
        targetType,
        targetId,
        note: note || undefined,
        // Demo verisi sabit bir "şimdi" kullanır; en üste çıkması için küçük bir ekleme.
        createdAt: BUGUN + kayitSayaci,
      };
      return { ...d, kayitlar: [kayit, ...d.kayitlar] };
    },
    [],
  );

  const sikayetiCoz = useCallback(
    (id: string, sonuc: string, not: string) => {
      setDurum((d) => {
        const yeni = {
          ...d,
          sikayetler: d.sikayetler.map((r) =>
            r.id === id
              ? { ...r, status: 'resolved' as const, resolvedBy: YONETICI.id, resolvedAt: BUGUN, resolution: sonuc }
              : r,
          ),
        };
        return kaydet(yeni, 'şikayet çözüldü', 'report', id, not || sonuc);
      });
    },
    [kaydet],
  );

  const sikayetiReddet = useCallback(
    (id: string, not: string) => {
      setDurum((d) => {
        const yeni = {
          ...d,
          sikayetler: d.sikayetler.map((r) =>
            r.id === id
              ? { ...r, status: 'dismissed' as const, resolvedBy: YONETICI.id, resolvedAt: BUGUN, resolution: not }
              : r,
          ),
        };
        return kaydet(yeni, 'şikayet reddedildi', 'report', id, not);
      });
    },
    [kaydet],
  );

  const ilaniKaldir = useCallback(
    (id: string, sebep: string) => {
      setDurum((d) => {
        const yeni = { ...d, ilanlar: d.ilanlar.filter((i) => i.id !== id) };
        return kaydet(yeni, 'ilan kaldırıldı', 'listing', id, sebep);
      });
    },
    [kaydet],
  );

  const kullaniciAskiyaAl = useCallback(
    (id: string, sebep: string) => {
      setDurum((d) => {
        const yeni = {
          ...d,
          profiller: d.profiller.map((p) =>
            p.id === id
              ? { ...p, status: 'suspended' as const, suspendedReason: sebep, suspendedAt: BUGUN }
              : p,
          ),
        };
        return kaydet(yeni, 'kullanıcı askıya alındı', 'profile', id, sebep);
      });
    },
    [kaydet],
  );

  const kullaniciAskisiniKaldir = useCallback(
    (id: string) => {
      setDurum((d) => {
        const yeni = {
          ...d,
          profiller: d.profiller.map((p) =>
            p.id === id
              ? { ...p, status: 'active' as const, suspendedReason: undefined, suspendedAt: undefined }
              : p,
          ),
        };
        return kaydet(yeni, 'kullanıcı askısı kaldırıldı', 'profile', id);
      });
    },
    [kaydet],
  );

  const kullaniciSil = useCallback(
    (id: string, not: string) => {
      setDurum((d) => {
        const yeni = { ...d, profiller: d.profiller.filter((p) => p.id !== id) };
        return kaydet(yeni, 'hesap silindi', 'profile', id, not || 'KVKK talebi');
      });
    },
    [kaydet],
  );

  const uyariGonder = useCallback(
    (hedefTur: string, hedefId: string, not: string) => {
      setDurum((d) => kaydet(d, 'uyarı gönderildi', hedefTur, hedefId, not));
    },
    [kaydet],
  );

  const ilanKisiti = useCallback(
    (takimId: string, not: string) => {
      setDurum((d) => kaydet(d, 'ilan verme kısıtlandı', 'team', takimId, not));
    },
    [kaydet],
  );

  const gelmemeyiGecersizSay = useCallback(
    (macId: string, not: string) => {
      setDurum((d) => {
        const yeni = {
          ...d,
          maclar: d.maclar.map((m) => (m.id === macId ? { ...m, noShow: false } : m)),
        };
        return kaydet(yeni, 'gelmeme bildirimi geçersiz sayıldı', 'match', macId, not);
      });
    },
    [kaydet],
  );

  const basvuruKarari = useCallback(
    (id: string, karar: 'accepted' | 'rejected', not: string) => {
      setDurum((d) => {
        const yeni = {
          ...d,
          basvurular: d.basvurular.map((b) => (b.id === id ? { ...b, status: karar } : b)),
        };
        return kaydet(
          yeni,
          karar === 'accepted' ? 'turnuva başvurusu onaylandı' : 'turnuva başvurusu reddedildi',
          'tournament',
          id,
          not,
        );
      });
    },
    [kaydet],
  );

  const turnuvaEkle = useCallback(
    (turnuva: Omit<Tournament, 'id' | 'createdAt' | 'status'>) => {
      setDurum((d) => {
        const id = `tr${d.turnuvalar.length + 1}`;
        const yeni = {
          ...d,
          turnuvalar: [
            { ...turnuva, id, status: 'draft' as const, createdAt: BUGUN + kayitSayaci },
            ...d.turnuvalar,
          ],
        };
        return kaydet(yeni, 'turnuva oluşturuldu', 'tournament', id, turnuva.name);
      });
    },
    [kaydet],
  );

  const duyuruGonder = useCallback(
    (duyuru: Omit<Announcement, 'id' | 'createdAt'>) => {
      setDurum((d) => {
        const id = `d${d.duyurular.length + 1}`;
        const yeni = {
          ...d,
          duyurular: [{ ...duyuru, id, createdAt: BUGUN + kayitSayaci }, ...d.duyurular],
        };
        return kaydet(yeni, 'duyuru gönderildi', 'announcement', id, duyuru.title);
      });
    },
    [kaydet],
  );

  const deger = useMemo(
    () => ({
      ...durum,
      sikayetiCoz,
      sikayetiReddet,
      ilaniKaldir,
      kullaniciAskiyaAl,
      kullaniciAskisiniKaldir,
      kullaniciSil,
      uyariGonder,
      ilanKisiti,
      gelmemeyiGecersizSay,
      basvuruKarari,
      turnuvaEkle,
      duyuruGonder,
    }),
    [
      durum,
      sikayetiCoz,
      sikayetiReddet,
      ilaniKaldir,
      kullaniciAskiyaAl,
      kullaniciAskisiniKaldir,
      kullaniciSil,
      uyariGonder,
      ilanKisiti,
      gelmemeyiGecersizSay,
      basvuruKarari,
      turnuvaEkle,
      duyuruGonder,
    ],
  );

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

export function useVeri() {
  const deger = useContext(Baglam);
  if (!deger) throw new Error('useVeri yalnızca VeriSaglayici içinde kullanılabilir.');
  return deger;
}
