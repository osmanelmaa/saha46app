'use client';

/** Panelde tekrar eden küçük görsel parçalar. */

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { IlanTuru, SikayetDurumu, Team } from '@/lib/tipler';

/* --- Rozet ---------------------------------------------------------------- */

type RozetTonu = 'notr' | 'teal' | 'yesil' | 'uyari' | 'kirmizi' | 'dolu';

export function Rozet({ ton = 'notr', children }: { ton?: RozetTonu; children: ReactNode }) {
  return <span className={ton === 'notr' ? 'rozet' : `rozet ${ton}`}>{children}</span>;
}

/* --- Takım arması --------------------------------------------------------- */

export function Arma({ takim, boyut = 32 }: { takim?: Team; boyut?: number }) {
  if (!takim) {
    return (
      <span
        className="arma"
        style={{ background: 'var(--line-strong)', width: boyut, height: boyut }}
        aria-hidden="true"
      >
        ?
      </span>
    );
  }
  // Takımın yüklediği arma varsa onu göster, yoksa renk + kısaltma.
  if (takim.logo_url) {
    return (
      <img
        className="arma"
        src={takim.logo_url}
        alt=""
        width={boyut}
        height={boyut}
        style={{ width: boyut, height: boyut, objectFit: 'cover' }}
      />
    );
  }
  return (
    <span className="arma" style={{ background: takim.color, width: boyut, height: boyut }} aria-hidden="true">
      {takim.short}
    </span>
  );
}

/**
 * Kullanıcı avatarı. Google ile giriş yapanlarda profil fotoğrafı gelir;
 * yoksa adın baş harfi gösterilir.
 */
export function Avatar({
  ad,
  url,
  boyut = 32,
}: {
  ad?: string | null;
  url?: string | null;
  boyut?: number;
}) {
  if (url) {
    return (
      <img
        className="arma"
        src={url}
        alt=""
        width={boyut}
        height={boyut}
        style={{ width: boyut, height: boyut, objectFit: 'cover', borderRadius: '50%' }}
      />
    );
  }
  const harf = (ad ?? '').trim().charAt(0).toLocaleUpperCase('tr') || '?';
  return (
    <span
      className="arma"
      style={{
        width: boyut,
        height: boyut,
        borderRadius: '50%',
        background: 'var(--surface-alt)',
        color: 'var(--primary-ink)',
        fontSize: Math.round(boyut * 0.42),
      }}
      aria-hidden="true"
    >
      {harf}
    </span>
  );
}

/* --- Sayı kartı ----------------------------------------------------------- */

export function SayiKart({
  baslik,
  deger,
  alt,
  ton,
  git,
  gitMetni,
}: {
  baslik: string;
  deger: number | string;
  alt?: string;
  ton?: 'vurgu' | 'iyi';
  git?: string;
  gitMetni?: string;
}) {
  const govde = (
    <>
      <div className="ust">{baslik}</div>
      <div className="deger">{deger}</div>
      {alt && <div className="alt">{alt}</div>}
      {git && <div className="git">{gitMetni ?? 'Ekrana git'} →</div>}
    </>
  );
  const sinif = `sayi-kart${ton ? ` ${ton}` : ''}`;
  return git ? (
    <Link className={sinif} href={git}>
      {govde}
    </Link>
  ) : (
    <div className={sinif}>{govde}</div>
  );
}

/* --- Bilgilendirme -------------------------------------------------------- */

export function Rehber({ baslik, children }: { baslik: string; children: ReactNode }) {
  return (
    <div className="rehber">
      <span className="isaret" aria-hidden="true">i</span>
      <div>
        <strong>{baslik}</strong>
        {children}
      </div>
    </div>
  );
}

export function BosHal({ baslik, aciklama, sutun = 12 }: { baslik: string; aciklama: string; sutun?: number }) {
  return (
    <tr>
      <td colSpan={sutun} style={{ padding: 0 }}>
        <div className="bos-hal">
          <div className="simge" aria-hidden="true">—</div>
          <strong>{baslik}</strong>
          <p>{aciklama}</p>
        </div>
      </td>
    </tr>
  );
}

export function Eylem({
  ad,
  ne,
  tehlikeli,
  kapali,
  tikla,
}: {
  ad: string;
  ne: string;
  tehlikeli?: boolean;
  kapali?: boolean;
  tikla: () => void;
}) {
  return (
    <button
      type="button"
      className={`eylem${tehlikeli ? ' tehlikeli' : ''}`}
      onClick={tikla}
      disabled={kapali}
      style={kapali ? { opacity: 0.55, cursor: 'default' } : undefined}
    >
      <span className="ad">{ad}</span>
      <span className="ne">{ne}</span>
    </button>
  );
}

/* --- Yükleniyor / hata ---------------------------------------------------- */

export function Yukleniyor({ metin = 'Veriler yükleniyor…' }: { metin?: string }) {
  return (
    <div className="bos-hal">
      <div className="simge" aria-hidden="true">…</div>
      <strong>{metin}</strong>
    </div>
  );
}

export function HataKutusu({ hata, yenile }: { hata: string; yenile?: () => void }) {
  return (
    <div className="kutu kirmizi" style={{ marginBottom: 20 }}>
      <h4>Veri alınamadı</h4>
      {hata}
      {yenile && (
        <div style={{ marginTop: 10 }}>
          <button type="button" className="btn btn-cizgi btn-kucuk" onClick={yenile}>
            Yeniden dene
          </button>
        </div>
      )}
    </div>
  );
}

/* --- Durum ve tür etiketleri ---------------------------------------------- */

export function SikayetRozeti({ durum }: { durum: SikayetDurumu }) {
  if (durum === 'open') return <Rozet ton="kirmizi">Açık</Rozet>;
  if (durum === 'resolved') return <Rozet ton="yesil">Çözüldü</Rozet>;
  return <Rozet>Reddedildi</Rozet>;
}

/** reports.reason serbest metindir; bilinen değerler çevrilir, diğerleri olduğu gibi gösterilir. */
const SEBEPLER: Record<string, string> = {
  'sahte-ilan': 'Sahte ilan',
  hakaret: 'Hakaret',
  taciz: 'Taciz',
  spam: 'Spam',
  diger: 'Diğer',
};
export const sebepMetni = (deger: string) => SEBEPLER[deger] ?? deger;

const HEDEFLER: Record<string, string> = {
  team: 'Takım',
  profile: 'Kullanıcı',
  listing: 'İlan',
  match: 'Maç',
};
export const hedefMetni = (deger: string) => HEDEFLER[deger] ?? deger;

export const TUR_METNI: Record<IlanTuru, string> = {
  rakip: 'Rakip arıyor',
  oyuncu: 'Oyuncu arıyor',
  kaleci: 'Kaleci arıyor',
  turnuva: 'Turnuva',
  kiralik: 'Kiralık oyuncu',
};

export function IlanTuruRozeti({ tur }: { tur: IlanTuru }) {
  const ton: RozetTonu = tur === 'rakip' ? 'teal' : tur === 'kiralik' ? 'yesil' : 'notr';
  return <Rozet ton={ton}>{TUR_METNI[tur] ?? tur}</Rozet>;
}
