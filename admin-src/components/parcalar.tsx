'use client';

/** Panelde tekrar eden küçük görsel parçalar. */

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Listing, ListingKind, Report, Team } from '@/lib/tipler';

/* --- Rozet ---------------------------------------------------------------- */

type RozetTonu = 'notr' | 'teal' | 'yesil' | 'uyari' | 'kirmizi' | 'dolu';

export function Rozet({ ton = 'notr', children }: { ton?: RozetTonu; children: ReactNode }) {
  const sinif = ton === 'notr' ? 'rozet' : `rozet ${ton}`;
  return <span className={sinif}>{children}</span>;
}

/* --- Takım arması --------------------------------------------------------- */

export function Arma({ takim, boyut = 32 }: { takim?: Team; boyut?: number }) {
  if (!takim) {
    return (
      <span className="arma" style={{ background: 'var(--line-strong)', width: boyut, height: boyut }} aria-hidden="true">
        ?
      </span>
    );
  }
  return (
    <span
      className="arma"
      style={{ background: takim.color, width: boyut, height: boyut }}
      aria-hidden="true"
    >
      {takim.short}
    </span>
  );
}

export function TakimHucre({ takim }: { takim?: Team }) {
  return (
    <span className="takim-hucre">
      <Arma takim={takim} />
      <span>
        <strong>{takim?.name ?? 'Bilinmeyen takım'}</strong>
        {takim && <div className="silik" style={{ fontSize: 12 }}>{takim.district} · {takim.level}</div>}
      </span>
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
  /** Verilirse kart tıklanabilir olur ve bu adrese götürür. */
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
  if (git) {
    return (
      <Link className={sinif} href={git}>
        {govde}
      </Link>
    );
  }
  return <div className={sinif}>{govde}</div>;
}

/** Ekranın ne işe yaradığını ve nasıl kullanılacağını anlatan şerit. */
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

/** Tablo içinde boş durum. */
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

/** Yan panelde açıklamalı eylem düğmesi. */
export function Eylem({
  ad,
  ne,
  tehlikeli,
  tikla,
}: {
  ad: string;
  ne: string;
  tehlikeli?: boolean;
  tikla: () => void;
}) {
  return (
    <button type="button" className={`eylem${tehlikeli ? ' tehlikeli' : ''}`} onClick={tikla}>
      <span className="ad">{ad}</span>
      <span className="ne">{ne}</span>
    </button>
  );
}

/* --- Durum ve tür etiketleri ---------------------------------------------- */

export function SikayetDurumu({ durum }: { durum: Report['status'] }) {
  if (durum === 'open') return <Rozet ton="kirmizi">Açık</Rozet>;
  if (durum === 'resolved') return <Rozet ton="yesil">Çözüldü</Rozet>;
  return <Rozet>Reddedildi</Rozet>;
}

export const SEBEP_METNI: Record<Report['reason'], string> = {
  'sahte-ilan': 'Sahte ilan',
  hakaret: 'Hakaret',
  taciz: 'Taciz',
  spam: 'Spam',
  diger: 'Diğer',
};

export const TUR_METNI: Record<ListingKind, string> = {
  rakip: 'Rakip arıyor',
  oyuncu: 'Oyuncu arıyor',
  kaleci: 'Kaleci arıyor',
  turnuva: 'Turnuva',
  kiralik: 'Kiralık oyuncu',
};

export const HEDEF_METNI: Record<Report['targetType'], string> = {
  team: 'Takım',
  profile: 'Kullanıcı',
  listing: 'İlan',
};

export function IlanTuru({ tur }: { tur: ListingKind }) {
  const ton: RozetTonu = tur === 'rakip' ? 'teal' : tur === 'kiralik' ? 'yesil' : 'notr';
  return <Rozet ton={ton}>{TUR_METNI[tur]}</Rozet>;
}

export function IlanBasligi({ ilan }: { ilan: Listing }) {
  if (ilan.kind === 'kiralik') return <>{ilan.playerName ?? 'Kiralık oyuncu'}</>;
  return <>{ilan.pitch}</>;
}

/* --- Boş durum ------------------------------------------------------------ */

export function BosDurum({ metin }: { metin: string }) {
  return (
    <tr>
      <td className="bos-satir" colSpan={12}>
        {metin}
      </td>
    </tr>
  );
}
