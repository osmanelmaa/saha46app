'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { girisYap } from '@/lib/oturum';
import { Logo } from '@/components/Logo';

/**
 * Sahte giriş ekranı.
 * Herhangi bir e-posta ve şifre panele girer; doğrulama yapılmaz.
 */
export default function GirisSayfasi() {
  const router = useRouter();
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');

  const gonder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eposta.trim() || !sifre.trim()) {
      setHata('E-posta ve şifre alanlarını doldurun.');
      return;
    }
    girisYap(eposta.trim());
    router.replace('/');
  };

  return (
    <div className="giris-sayfa">
      <div className="giris-kutu">
        <Logo boyut={56} yuvarlak={16} />
        <h1 style={{ marginTop: 16 }}>Saha46 Yönetim</h1>
        <p className="sonuk" style={{ marginTop: 6 }}>
          Moderasyon ve yönetim paneline giriş yapın.
        </p>

        <div className="kutu uyari" style={{ marginTop: 16 }}>
          <strong>Demo panel.</strong> Kimlik doğrulama yoktur; herhangi bir e-posta ve şifre
          ile giriş yapılır. Görülen tüm veriler sahtedir.
        </div>

        <form onSubmit={gonder}>
          <div className="alan">
            <label htmlFor="eposta">E-posta</label>
            <input
              id="eposta"
              type="email"
              value={eposta}
              onChange={(e) => {
                setEposta(e.target.value);
                setHata('');
              }}
              placeholder="ornek@saha46.app"
              autoComplete="username"
            />
          </div>

          <div className="alan">
            <label htmlFor="sifre">Şifre</label>
            <input
              id="sifre"
              type="password"
              value={sifre}
              onChange={(e) => {
                setSifre(e.target.value);
                setHata('');
              }}
              autoComplete="current-password"
            />
          </div>

          {hata && (
            <p className="ipucu" style={{ color: 'var(--danger)' }}>
              {hata}
            </p>
          )}

          <button type="submit" className="btn btn-ana" style={{ width: '100%' }}>
            Panele gir
          </button>
        </form>
      </div>
    </div>
  );
}
