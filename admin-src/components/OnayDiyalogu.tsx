'use client';

/**
 * Onay diyaloğu.
 *
 * Her yönetim işlemi buradan geçer: ne yapılacağı yazılır, isteğe bağlı bir
 * not alınır ve onaylanırsa işlem yürütülür. Not, işlem kaydına düşer.
 */

import { useEffect, useRef, useState } from 'react';

export type OnayIstegi = {
  baslik: string;
  aciklama: string;
  onayMetni: string;
  /** Onaylanırsa tam olarak ne olacağı — madde madde. */
  sonuclar?: string[];
  tehlikeli?: boolean;
  notEtiketi?: string;
  notZorunlu?: boolean;
  notOnerileri?: string[];
  uygula: (not: string) => void;
};

export function OnayDiyalogu({ istek, kapat }: { istek: OnayIstegi | null; kapat: () => void }) {
  const [not, setNot] = useState('');
  const [hata, setHata] = useState('');
  const ilkAlan = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setNot('');
    setHata('');
    if (istek) {
      const zamanlayici = setTimeout(() => ilkAlan.current?.focus(), 30);
      return () => clearTimeout(zamanlayici);
    }
  }, [istek]);

  useEffect(() => {
    if (!istek) return;
    const dinle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') kapat();
    };
    window.addEventListener('keydown', dinle);
    return () => window.removeEventListener('keydown', dinle);
  }, [istek, kapat]);

  if (!istek) return null;

  const gonder = () => {
    if (istek.notZorunlu && !not.trim()) {
      setHata('Bu işlem için gerekçe yazılmalıdır.');
      return;
    }
    istek.uygula(not.trim());
    kapat();
  };

  return (
    <div className="diyalog-perde" role="presentation" onClick={kapat}>
      <div
        className="diyalog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="diyalog-baslik"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="diyalog-baslik">{istek.baslik}</h3>
        <p className="aciklama">{istek.aciklama}</p>

        {istek.sonuclar && istek.sonuclar.length > 0 && (
          <ul className="sonuc-liste">
            {istek.sonuclar.map((madde) => (
              <li key={madde}>{madde}</li>
            ))}
          </ul>
        )}

        <div className="alan">
          <label htmlFor="diyalog-not">
            {istek.notEtiketi ?? 'Not'} {istek.notZorunlu ? '' : '(isteğe bağlı)'}
          </label>
          <textarea
            id="diyalog-not"
            ref={ilkAlan}
            value={not}
            onChange={(e) => {
              setNot(e.target.value);
              if (hata) setHata('');
            }}
            rows={3}
            maxLength={400}
          />
          {istek.notOnerileri && istek.notOnerileri.length > 0 && (
            <div className="btn-sira" style={{ marginTop: 4 }}>
              {istek.notOnerileri.map((oneri) => (
                <button
                  key={oneri}
                  type="button"
                  className="btn btn-cizgi btn-kucuk"
                  onClick={() => setNot(oneri)}
                >
                  {oneri}
                </button>
              ))}
            </div>
          )}
          {hata && <p className="ipucu" style={{ color: 'var(--danger)' }}>{hata}</p>}
        </div>

        <div className="diyalog-butonlar">
          <button type="button" className="btn btn-sessiz" onClick={kapat}>
            Vazgeç
          </button>
          <button
            type="button"
            className={istek.tehlikeli ? 'btn btn-tehlike' : 'btn btn-ana'}
            onClick={gonder}
          >
            {istek.onayMetni}
          </button>
        </div>
      </div>
    </div>
  );
}
