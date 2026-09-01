'use client';

/**
 * Panel kabuğu: demo şeridi, sol kenar menüsü ve içerik alanı.
 * Giriş ekranında kabuk gösterilmez.
 */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useVeri } from '@/lib/durum';
import { cikisYap, profiliGetir } from '@/lib/oturum';
import type { YoneticiProfili } from '@/lib/supabase';
import { Logo } from '@/components/Logo';

type MenuOgesi = { yol: string; ad: string; ikon: ReactNode; sayacTuru?: 'sikayet' | 'gelmeme' };

const ikon = (d: string) => (
  <svg className="ikon" viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);

const MENU: { baslik: string; ogeler: MenuOgesi[] }[] = [
  {
    baslik: 'Kuyruk',
    ogeler: [
      { yol: '/', ad: 'Özet', ikon: ikon('M4 13h6V4H4v9zm10 7h6v-9h-6v9zM4 20h6v-4H4v4zM14 8h6V4h-6v4z') },
      {
        yol: '/sikayetler',
        ad: 'Şikayetler',
        ikon: ikon('M12 3l9 16H3l9-16zm0 6v4m0 3v.5'),
        sayacTuru: 'sikayet',
      },
      {
        yol: '/gelmeyenler',
        ad: 'Gelmeme bildirimleri',
        ikon: ikon('M5 5l14 14M19 5L5 19'),
        sayacTuru: 'gelmeme',
      },
    ],
  },
  {
    baslik: 'İçerik',
    ogeler: [
      { yol: '/ilanlar', ad: 'İlanlar', ikon: ikon('M4 6h16M4 12h16M4 18h10') },
      { yol: '/kullanicilar', ad: 'Kullanıcılar ve takımlar', ikon: ikon('M16 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 10.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-2a4 4 0 00-3-3.9') },
    ],
  },
  {
    baslik: 'Yönetim',
    ogeler: [
      { yol: '/kayitlar', ad: 'İşlem kaydı', ikon: ikon('M6 4h9l4 4v12H6V4zM14 4v5h5M9 13h7M9 17h5') },
    ],
  },
];

export function Kabuk({ children }: { children: ReactNode }) {
  const yol = usePathname();
  const router = useRouter();
  const veri = useVeri();
  const [hazir, setHazir] = useState(false);
  const [profil, setProfil] = useState<YoneticiProfili | null>(null);

  const girisSayfasi = yol?.startsWith('/giris') ?? false;

  // Yönetici oturumu yoksa panel gösterilmez, giriş ekranına dönülür.
  useEffect(() => {
    if (girisSayfasi) {
      setHazir(true);
      return;
    }
    let iptal = false;
    profiliGetir().then((p) => {
      if (iptal) return;
      if (!p || p.role !== 'admin' || p.status !== 'active') {
        router.replace('/giris');
        return;
      }
      setProfil(p);
      setHazir(true);
    });
    return () => {
      iptal = true;
    };
  }, [girisSayfasi, router]);

  if (girisSayfasi) return <>{children}</>;

  const acikSikayet = veri.sikayetler.filter((r) => r.status === 'open').length;
  const acikGelmeme = veri.degerlendirmeler.filter((d) => d.no_show).length;

  const sayac = (tur?: MenuOgesi['sayacTuru']) => {
    if (tur === 'sikayet') return acikSikayet;
    if (tur === 'gelmeme') return acikGelmeme;
    return 0;
  };

  const etkinMi = (hedef: string) => {
    if (hedef === '/') return yol === '/' || yol === '';
    return yol?.startsWith(hedef) ?? false;
  };

  return (
    <>
      <div className="demo-serit canli" role="status">
        <span>
          Canlı veri — yaptığınız her işlem kalıcıdır ve işlem kaydına yazılır.
        </span>
        <button type="button" onClick={() => void veri.yenile()} disabled={veri.yukleniyor}>
          {veri.yukleniyor ? 'Yenileniyor…' : 'Yenile'}
        </button>
      </div>

      <div className="kabuk">
        <aside className="kenar">
          <Link className="kenar-marka" href="/">
            <Logo boyut={36} yuvarlak={11} />
            <span>
              <strong>Saha46</strong>
              <span>Yönetim</span>
            </span>
          </Link>

          {MENU.map((bolum) => (
            <div key={bolum.baslik}>
              <div className="menu-baslik">{bolum.baslik}</div>
              <nav>
                {bolum.ogeler.map((oge) => {
                  const adet = sayac(oge.sayacTuru);
                  return (
                    <Link
                      key={oge.yol}
                      href={oge.yol}
                      className={`menu-oge${etkinMi(oge.yol) ? ' etkin' : ''}`}
                      aria-current={etkinMi(oge.yol) ? 'page' : undefined}
                    >
                      {oge.ikon}
                      <span>{oge.ad}</span>
                      {adet > 0 && <span className="sayac">{adet}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}

          <div className="kenar-alt">
            <strong>{profil?.name || profil?.email || 'yönetici'}</strong>
            <span>{profil?.email ?? 'Yönetici'}</span>
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                className="btn btn-cizgi btn-kucuk"
                onClick={async () => {
                  await cikisYap();
                  router.replace('/giris');
                }}
              >
                Çıkış yap
              </button>
            </div>
          </div>
        </aside>

        <main className="icerik">
          {hazir ? children : <p className="sonuk">Yükleniyor…</p>}
        </main>
      </div>
    </>
  );
}
