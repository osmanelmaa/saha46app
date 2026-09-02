'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { girisYap, profiliGetir, yapilandirmaEksik } from '@/lib/oturum';
import { Logo } from '@/components/Logo';

/**
 * Yönetici girişi.
 *
 * Kimlik doğrulama gerçektir: e-posta ve şifre Supabase'e sorulur, sonra
 * profiles tablosundaki rol denetlenir. Yalnızca yönetici hesapları girer.
 */
export default function GirisSayfasi() {
  const router = useRouter();
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [denetleniyor, setDenetleniyor] = useState(true);

  // Zaten açık bir yönetici oturumu varsa doğrudan panele geç.
  useEffect(() => {
    let iptal = false;
    profiliGetir().then((profil) => {
      if (iptal) return;
      if (profil && profil.role === 'admin' && profil.status === 'active') {
        router.replace('/');
      } else {
        setDenetleniyor(false);
      }
    });
    return () => {
      iptal = true;
    };
  }, [router]);

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eposta.trim() || !sifre) {
      setHata('E-posta ve şifre alanlarını doldurun.');
      return;
    }

    setGonderiliyor(true);
    setHata('');
    const sonuc = await girisYap(eposta.trim(), sifre);
    if (sonuc.ok) {
      router.replace('/');
      return;
    }
    setHata(sonuc.hata);
    setSifre('');
    setGonderiliyor(false);
  };

  return (
    <div className="giris-sayfa">
      <div className="giris-kutu">
        <Logo boyut={56} yuvarlak={16} />
        <h1 style={{ marginTop: 16 }}>Saha46 Yönetim</h1>
        <p className="sonuk" style={{ marginTop: 6 }}>
          Moderasyon ve yönetim paneline giriş yapın.
        </p>

        {yapilandirmaEksik && (
          <div className="kutu kirmizi" style={{ marginTop: 16 }}>
            <strong>Panel yapılandırılmamış.</strong> Supabase bağlantı bilgileri
            derleme sırasında tanımlanmamış; giriş yapılamaz.
          </div>
        )}

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
              disabled={gonderiliyor || denetleniyor}
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
              disabled={gonderiliyor || denetleniyor}
            />
          </div>

          {hata && (
            <p className="ipucu" style={{ color: 'var(--danger)' }} role="alert">
              {hata}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-ana"
            style={{ width: '100%' }}
            disabled={gonderiliyor || denetleniyor || yapilandirmaEksik}
          >
            {denetleniyor ? 'Denetleniyor…' : gonderiliyor ? 'Giriş yapılıyor…' : 'Panele gir'}
          </button>
        </form>
      </div>
    </div>
  );
}
