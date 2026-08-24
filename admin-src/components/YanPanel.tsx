'use client';

/** Tablo satırına tıklandığında açılan sağ panel. */

import { useEffect, type ReactNode } from 'react';

export function YanPanel({
  baslik,
  altBaslik,
  acik,
  kapat,
  alt,
  children,
}: {
  baslik: string;
  altBaslik?: ReactNode;
  acik: boolean;
  kapat: () => void;
  alt?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!acik) return;
    const dinle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') kapat();
    };
    window.addEventListener('keydown', dinle);
    return () => window.removeEventListener('keydown', dinle);
  }, [acik, kapat]);

  if (!acik) return null;

  return (
    <>
      <div className="perde" role="presentation" onClick={kapat} />
      <aside className="yan-panel" role="dialog" aria-modal="true" aria-label={baslik}>
        <div className="yan-panel-basi">
          <div>
            <h2>{baslik}</h2>
            {altBaslik && <div className="sonuk" style={{ fontSize: 13, marginTop: 2 }}>{altBaslik}</div>}
          </div>
          <button type="button" className="kapat" onClick={kapat} aria-label="Paneli kapat">
            ×
          </button>
        </div>
        <div className="yan-panel-govde">{children}</div>
        {alt && <div className="yan-panel-alt">{alt}</div>}
      </aside>
    </>
  );
}

export function Satir({ baslik, children }: { baslik: string; children: ReactNode }) {
  return (
    <div className="satir">
      <dt>{baslik}</dt>
      <dd>{children}</dd>
    </div>
  );
}
