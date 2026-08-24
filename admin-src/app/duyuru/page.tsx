'use client';

import { useMemo, useState } from 'react';
import { useVeri } from '@/lib/durum';
import { tarihSaat } from '@/lib/bicim';
import { ILCELER, SEVIYELER } from '@/lib/mock/sabitler';
import { OnayDiyalogu, type OnayIstegi } from '@/components/OnayDiyalogu';
import { Rehber, Rozet } from '@/components/parcalar';
import { Logo } from '@/components/Logo';

type HedefTuru = 'all' | 'district' | 'level';

export default function DuyuruSayfasi() {
  const veri = useVeri();
  const [baslik, setBaslik] = useState('');
  const [metin, setMetin] = useState('');
  const [hedefTuru, setHedefTuru] = useState<HedefTuru>('all');
  const [hedefDegeri, setHedefDegeri] = useState<string>(ILCELER[0]);
  const [hata, setHata] = useState('');
  const [onay, setOnay] = useState<OnayIstegi | null>(null);
  const [gonderildi, setGonderildi] = useState(false);

  // Duyurunun kaç kişiye gideceği sahte veriden hesaplanır.
  const alici = useMemo(() => {
    if (hedefTuru === 'all') return veri.profiller.filter((p) => p.role === 'user');
    if (hedefTuru === 'district') {
      const takimIdleri = veri.takimlar.filter((t) => t.district === hedefDegeri).map((t) => t.id);
      return veri.profiller.filter((p) => p.teamId && takimIdleri.includes(p.teamId));
    }
    const takimIdleri = veri.takimlar.filter((t) => t.level === hedefDegeri).map((t) => t.id);
    return veri.profiller.filter((p) => p.teamId && takimIdleri.includes(p.teamId));
  }, [hedefTuru, hedefDegeri, veri.profiller, veri.takimlar]);

  const hedefMetni =
    hedefTuru === 'all'
      ? 'Tüm kullanıcılar'
      : hedefTuru === 'district'
        ? `${hedefDegeri} ilçesindeki takımlar`
        : `${hedefDegeri} seviyesindeki takımlar`;

  const gonder = () => {
    if (!baslik.trim() || !metin.trim()) {
      setHata('Başlık ve metin alanları zorunludur.');
      return;
    }
    setHata('');
    setOnay({
      baslik: 'Duyuru gönderilsin mi?',
      aciklama: `"${baslik.trim()}" başlıklı duyuru ${hedefMetni.toLocaleLowerCase('tr')} için yaklaşık ${alici.length} kişiye gönderilecek.`,
      onayMetni: 'Gönder',
      sonuclar: [
        'Yaklaşık ' + alici.length + ' kişiye bildirim gider.',
        'Duyuru geçmişe eklenir.',
        'Gönderilen duyuru geri çekilemez.',
      ],
      notEtiketi: 'İşlem kaydına not',
      uygula: () => {
        veri.duyuruGonder({
          title: baslik.trim(),
          body: metin.trim(),
          audience: { type: hedefTuru, value: hedefTuru === 'all' ? undefined : hedefDegeri },
        });
        setGonderildi(true);
        setBaslik('');
        setMetin('');
      },
    });
  };

  return (
    <>
      <div className="sayfa-basi">
        <div>
          <h1>Duyuru</h1>
          <p>Uygulama içi bildirim olarak gönderilecek duyuruyu hazırlayın.</p>
        </div>
      </div>

      <Rehber baslik="Nasıl çalışılır">
        Soldaki alanları doldurdukça sağdaki önizleme güncellenir; duyurunun telefonda nasıl
        görüneceğini oradan kontrol edin. Hedef kitleyi daralttığınızda alıcı sayısı da değişir.
      </Rehber>

      <div className="kutu uyari" style={{ marginBottom: 20 }}>
        Gönderim demo amaçlıdır. Hiçbir kullanıcıya bildirim iletilmez; yalnızca önizleme
        oluşturulur ve işlem kaydına satır düşer.
      </div>

      {gonderildi && (
        <div className="kutu yesil" style={{ marginBottom: 20 }}>
          Duyuru oluşturuldu ve geçmişe eklendi.
        </div>
      )}

      <div className="ikili">
        <section className="kart">
          <div className="kart-basi">
            <h2>Duyuru metni</h2>
          </div>
          <div className="kart-govde" style={{ display: 'grid', gap: 16 }}>
            <div className="alan">
              <label htmlFor="d-baslik">Başlık</label>
              <input
                id="d-baslik"
                type="text"
                maxLength={80}
                value={baslik}
                onChange={(e) => {
                  setBaslik(e.target.value);
                  setHata('');
                  setGonderildi(false);
                }}
                placeholder="Örnek: Hafta sonu yoğunluğu"
              />
              <p className="ipucu">{baslik.length}/80</p>
            </div>

            <div className="alan">
              <label htmlFor="d-metin">Metin</label>
              <textarea
                id="d-metin"
                rows={6}
                maxLength={500}
                value={metin}
                onChange={(e) => {
                  setMetin(e.target.value);
                  setHata('');
                  setGonderildi(false);
                }}
              />
              <p className="ipucu">{metin.length}/500</p>
            </div>

            <div className="alan">
              <label htmlFor="d-hedef">Hedef kitle</label>
              <select
                id="d-hedef"
                value={hedefTuru}
                onChange={(e) => {
                  const yeni = e.target.value as HedefTuru;
                  setHedefTuru(yeni);
                  setHedefDegeri(yeni === 'level' ? SEVIYELER[0] : ILCELER[0]);
                }}
              >
                <option value="all">Tüm kullanıcılar</option>
                <option value="district">Belirli ilçe</option>
                <option value="level">Belirli seviye</option>
              </select>
            </div>

            {hedefTuru !== 'all' && (
              <div className="alan">
                <label htmlFor="d-deger">{hedefTuru === 'district' ? 'İlçe' : 'Seviye'}</label>
                <select id="d-deger" value={hedefDegeri} onChange={(e) => setHedefDegeri(e.target.value)}>
                  {(hedefTuru === 'district' ? ILCELER : SEVIYELER).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {hata && (
              <p className="ipucu" style={{ color: 'var(--danger)' }}>
                {hata}
              </p>
            )}

            <div className="btn-sira">
              <button type="button" className="btn btn-ana" onClick={gonder}>
                Gönder
              </button>
              <button
                type="button"
                className="btn btn-sessiz"
                onClick={() => {
                  setBaslik('');
                  setMetin('');
                  setHata('');
                  setGonderildi(false);
                }}
              >
                Temizle
              </button>
            </div>
          </div>
        </section>

        <div style={{ display: 'grid', gap: 20 }}>
          <section className="kart">
            <div className="kart-basi">
              <h2>Önizleme</h2>
              <Rozet ton="teal">~{alici.length} kişi</Rozet>
            </div>
            <div className="kart-govde">
              <div className="mikro silik" style={{ marginBottom: 8 }}>
                {hedefMetni}
              </div>
              <div
                style={{
                  border: '1px solid var(--line-strong)',
                  borderRadius: 'var(--r-14)',
                  padding: 16,
                  background: 'var(--surface-alt)',
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Logo boyut={38} yuvarlak={11} />
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: 14 }}>
                      {baslik.trim() || 'Duyuru başlığı'}
                    </strong>
                    <p className="sonuk" style={{ fontSize: 13.5, marginTop: 4, whiteSpace: 'pre-wrap' }}>
                      {metin.trim() || 'Duyuru metni burada görünecek.'}
                    </p>
                  </div>
                </div>
              </div>
              <p className="ipucu" style={{ marginTop: 10 }}>
                Bildirim, uygulamayı o sırada açık olmayan kullanıcılara telefon bildirimi olarak düşer.
              </p>
            </div>
          </section>

          <section className="kart">
            <div className="kart-basi">
              <h2>Geçmiş duyurular</h2>
            </div>
            <div className="mini-liste">
              {veri.duyurular.length === 0 && (
                <div className="mini-oge">
                  <div className="govde">
                    <p>Kayıt yok.</p>
                  </div>
                </div>
              )}
              {veri.duyurular.map((d) => (
                <div className="mini-oge" key={d.id}>
                  <div className="govde">
                    <strong>{d.title}</strong>
                    <p>{d.body}</p>
                  </div>
                  <time>{tarihSaat(d.createdAt)}</time>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <OnayDiyalogu istek={onay} kapat={() => setOnay(null)} />
    </>
  );
}
