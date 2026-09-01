'use client';

/**
 * Panelin veri durumu.
 *
 * Veriler Supabase'ten gelir; yazma işlemleri doğrudan tabloya gider ve
 * RLS `is_admin()` politikalarıyla korunur. Her yaptırım audit_log'a
 * yazılır — kayıt atılamazsa işlem başarısız sayılır.
 *
 * İş kuralı taşıyan akışlar (teklif kabulü, maç sonucu, maç iptali) mobil
 * uygulamadaki RPC'lerin işidir; panel onları çağırmaz.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  hataMetni,
  ilaniKapat,
  kayitEkle,
  kullaniciDurumunuDegistir,
  kullaniciRolunuDegistir,
  panelVerisiniGetir,
  sikayetiSonuclandir,
  type PanelVerisi,
} from './db';
import { profiliGetir } from './oturum';
import type { YoneticiProfili } from './supabase';

const BOS: PanelVerisi = {
  profiller: [],
  takimlar: [],
  ilanlar: [],
  maclar: [],
  degerlendirmeler: [],
  sikayetler: [],
  kayitlar: [],
  uyeler: [],
};

type Baglam = PanelVerisi & {
  yukleniyor: boolean;
  hata: string;
  yenile: () => Promise<void>;
  yonetici: YoneticiProfili | null;

  sikayetiCoz: (id: string, sonuc: string, not: string) => Promise<void>;
  sikayetiReddet: (id: string, not: string) => Promise<void>;
  ilaniKaldir: (id: string, sebep: string) => Promise<void>;
  kullaniciAskiyaAl: (id: string, sebep: string) => Promise<void>;
  kullaniciAskisiniKaldir: (id: string) => Promise<void>;
  rolDegistir: (id: string, rol: 'user' | 'admin') => Promise<void>;
  uyariGonder: (hedefTur: string, hedefId: string, not: string) => Promise<void>;
  ilanKisiti: (takimId: string, not: string) => Promise<void>;
};

const VeriBaglami = createContext<Baglam | null>(null);

export function VeriSaglayici({ children }: { children: ReactNode }) {
  const [veri, setVeri] = useState<PanelVerisi>(BOS);
  const [yonetici, setYonetici] = useState<YoneticiProfili | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');

  const yukle = useCallback(async () => {
    try {
      setHata('');
      const profil = await profiliGetir();
      if (!profil || profil.role !== 'admin') {
        // Kabuk zaten giriş ekranına yönlendirir; burada veri çekmeye çalışma.
        setVeri(BOS);
        setYukleniyor(false);
        return;
      }
      setYonetici(profil);
      setVeri(await panelVerisiniGetir());
    } catch (e) {
      setHata(hataMetni(e));
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    void yukle();
  }, [yukle]);

  const yenile = useCallback(async () => {
    setYukleniyor(true);
    await yukle();
  }, [yukle]);

  /** Yaptırımı uygula, kaydı düş, veriyi tazele. Hata olursa yüzeye çıkar. */
  const islem = useCallback(
    async (
      calistir: () => Promise<void>,
      action: string,
      targetType: string,
      targetId: string | null,
      not?: string,
    ) => {
      if (!yonetici) throw new Error('Yönetici oturumu bulunamadı.');
      try {
        await calistir();
        await kayitEkle(yonetici.id, action, targetType, targetId, not);
        setVeri(await panelVerisiniGetir());
      } catch (e) {
        const metin = hataMetni(e);
        setHata(metin);
        throw new Error(metin);
      }
    },
    [yonetici],
  );

  const sikayetiCoz = useCallback(
    async (id: string, sonuc: string, not: string) => {
      await islem(
        async () => {
          await sikayetiSonuclandir(id, 'resolved', sonuc, yonetici!.id);
        },
        'şikayet çözüldü',
        'report',
        id,
        not || sonuc,
      );
    },
    [islem, yonetici],
  );

  const sikayetiReddet = useCallback(
    async (id: string, not: string) => {
      await islem(
        async () => {
          await sikayetiSonuclandir(id, 'dismissed', not, yonetici!.id);
        },
        'şikayet reddedildi',
        'report',
        id,
        not,
      );
    },
    [islem, yonetici],
  );

  const ilaniKaldir = useCallback(
    async (id: string, sebep: string) => {
      await islem(async () => { await ilaniKapat(id); }, 'ilan kaldırıldı', 'listing', id, sebep);
    },
    [islem],
  );

  const kullaniciAskiyaAl = useCallback(
    async (id: string, sebep: string) => {
      await islem(
        async () => { await kullaniciDurumunuDegistir(id, 'suspended', sebep); },
        'kullanıcı askıya alındı',
        'profile',
        id,
        sebep,
      );
    },
    [islem],
  );

  const kullaniciAskisiniKaldir = useCallback(
    async (id: string) => {
      await islem(
        async () => { await kullaniciDurumunuDegistir(id, 'active'); },
        'kullanıcı askısı kaldırıldı',
        'profile',
        id,
      );
    },
    [islem],
  );

  const rolDegistir = useCallback(
    async (id: string, rol: 'user' | 'admin') => {
      await islem(
        async () => { await kullaniciRolunuDegistir(id, rol); },
        rol === 'admin' ? 'yönetici yetkisi verildi' : 'yönetici yetkisi alındı',
        'profile',
        id,
      );
    },
    [islem],
  );

  // Bildirim altyapısı panelde yok: bu iki işlem yalnızca kayda geçer.
  const uyariGonder = useCallback(
    async (hedefTur: string, hedefId: string, not: string) => {
      await islem(async () => {}, 'uyarı gönderildi', hedefTur, hedefId, not);
    },
    [islem],
  );

  const ilanKisiti = useCallback(
    async (takimId: string, not: string) => {
      await islem(async () => {}, 'ilan verme kısıtlandı', 'team', takimId, not);
    },
    [islem],
  );

  const deger = useMemo<Baglam>(
    () => ({
      ...veri,
      yukleniyor,
      hata,
      yenile,
      yonetici,
      sikayetiCoz,
      sikayetiReddet,
      ilaniKaldir,
      kullaniciAskiyaAl,
      kullaniciAskisiniKaldir,
      rolDegistir,
      uyariGonder,
      ilanKisiti,
    }),
    [
      veri,
      yukleniyor,
      hata,
      yenile,
      yonetici,
      sikayetiCoz,
      sikayetiReddet,
      ilaniKaldir,
      kullaniciAskiyaAl,
      kullaniciAskisiniKaldir,
      rolDegistir,
      uyariGonder,
      ilanKisiti,
    ],
  );

  return <VeriBaglami.Provider value={deger}>{children}</VeriBaglami.Provider>;
}

export function useVeri() {
  const deger = useContext(VeriBaglami);
  if (!deger) throw new Error('useVeri yalnızca VeriSaglayici içinde kullanılabilir.');
  return deger;
}

/* -------------------------------------------------------------------------- */
/* Türetilmiş yardımcılar — ekranlar bunları kullanır                         */
/* -------------------------------------------------------------------------- */

/** Sahaya gelmeme bildirimleri match_ratings.no_show üzerinden okunur. */
export function gelmemeBildirimleri(veri: PanelVerisi) {
  return veri.degerlendirmeler.filter((d) => d.no_show);
}

/** Bir takımın aldığı gelmeme bildirimi sayısı. */
export function gelmemeSayisi(veri: PanelVerisi, takimId: string) {
  return veri.degerlendirmeler.filter((d) => d.no_show && d.rated_team_id === takimId).length;
}

/** Takımın oynanmış ve onaylanmış maçları — puan bunlardan hesaplanır. */
export function oynananMaclar(veri: PanelVerisi, takimId: string) {
  return veri.maclar.filter(
    (m) =>
      m.status === 'played' &&
      m.result_status === 'confirmed' &&
      (m.home_team_id === takimId || m.away_team_id === takimId),
  );
}

/** Takımın aldığı puanların ortalaması. */
export function ortalamaPuan(veri: PanelVerisi, takimId: string): string {
  const puanlar = veri.degerlendirmeler
    .filter((d) => d.rated_team_id === takimId && typeof d.rating === 'number')
    .map((d) => d.rating as number);
  if (puanlar.length === 0) return '—';
  return (puanlar.reduce((a, b) => a + b, 0) / puanlar.length).toFixed(1);
}
