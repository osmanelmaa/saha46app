'use client';

import { useMemo, useState } from 'react';
import { useVeri } from '@/lib/durum';
import { gecenSure, icerir, tarihSaat } from '@/lib/bicim';
import { BosHal, HataKutusu, Rehber, Rozet, Yukleniyor, hedefMetni } from '@/components/parcalar';

export default function KayitlarSayfasi() {
  const veri = useVeri();
  const [arama, setArama] = useState('');
  const [islem, setIslem] = useState('hepsi');
  const [hedef, setHedef] = useState('hepsi');
  const [baslangic, setBaslangic] = useState('');

  const kisi = (id: string | null) => veri.profiller.find((p) => p.id === id);

  const islemler = useMemo(
    () => [...new Set(veri.kayitlar.map((k) => k.action))].sort((a, b) => a.localeCompare(b, 'tr')),
    [veri.kayitlar],
  );

  const hedefTurleri = useMemo(
    () => [...new Set(veri.kayitlar.map((k) => k.target_type))].sort((a, b) => a.localeCompare(b, 'tr')),
    [veri.kayitlar],
  );

  const liste = useMemo(() => {
    const bas = baslangic ? Date.parse(`${baslangic}T00:00:00+03:00`) : null;
    return veri.kayitlar
      .filter((k) => (islem === 'hepsi' ? true : k.action === islem))
      .filter((k) => (hedef === 'hepsi' ? true : k.target_type === hedef))
      .filter((k) => (bas === null ? true : Date.parse(k.created_at) >= bas))
      .filter((k) => icerir(k.action, arama) || icerir(k.note, arama) || icerir(k.target_id, arama));
  }, [veri.kayitlar, islem, hedef, baslangic, arama]);

  if (veri.yukleniyor && veri.kayitlar.length === 0) return <Yukleniyor />;

  return (
    <>
      <div className="sayfa-basi">
        <div>
          <h1>İşlem kaydı</h1>
          <p>Panelde yapılan her işlem buraya düşer. Kayıtlar değiştirilemez.</p>
        </div>
        <Rozet>{veri.kayitlar.length} kayıt</Rozet>
      </div>

      {veri.hata && <HataKutusu hata={veri.hata} yenile={() => void veri.yenile()} />}

      <Rehber baslik="Bu kayıt neden önemli">
        Askıya alma ve ilan kaldırma gibi işlemler kalıcıdır. Bir kararın kim tarafından, ne zaman
        ve hangi gerekçeyle verildiği yalnızca burada görülür. Kayıtlar yalnızca eklenir; panelden
        silinemez ya da düzenlenemez.
      </Rehber>

      <section className="kart">
        <div className="filtreler">
          <div className="alan genis">
            <label htmlFor="arama">Ara</label>
            <input
              id="arama"
              type="text"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="İşlem, not ya da hedef kimliği"
            />
          </div>

          <div className="alan">
            <label htmlFor="islem">İşlem</label>
            <select id="islem" value={islem} onChange={(e) => setIslem(e.target.value)}>
              <option value="hepsi">Hepsi</option>
              {islemler.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          <div className="alan">
            <label htmlFor="hedef">Hedef türü</label>
            <select id="hedef" value={hedef} onChange={(e) => setHedef(e.target.value)}>
              <option value="hepsi">Hepsi</option>
              {hedefTurleri.map((h) => (
                <option key={h} value={h}>{hedefMetni(h)}</option>
              ))}
            </select>
          </div>

          <div className="alan">
            <label htmlFor="tarihten">Şu tarihten sonra</label>
            <input id="tarihten" type="date" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} />
          </div>

          <span className="filtre-ozet">{liste.length} kayıt</span>
        </div>

        <div className="tablo-sarmal">
          <table className="tablo">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Yönetici</th>
                <th>İşlem</th>
                <th>Hedef</th>
                <th>Not</th>
              </tr>
            </thead>
            <tbody>
              {liste.length === 0 && (
                <BosHal
                  baslik="Kayıt bulunamadı"
                  aciklama="Henüz işlem yapılmamış ya da filtreler eşleşmiyor."
                  sutun={5}
                />
              )}
              {liste.map((k) => (
                <tr key={k.id}>
                  <td>
                    <strong>{tarihSaat(k.created_at)}</strong>
                    <div className="silik" style={{ fontSize: 12 }}>{gecenSure(k.created_at)}</div>
                  </td>
                  <td>{kisi(k.admin_id)?.name || <span className="silik">—</span>}</td>
                  <td><strong>{k.action}</strong></td>
                  <td>
                    {hedefMetni(k.target_type)}
                    <div className="silik" style={{ fontSize: 12 }}>{k.target_id?.slice(0, 8) ?? '—'}</div>
                  </td>
                  <td>{k.note ?? <span className="silik">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
