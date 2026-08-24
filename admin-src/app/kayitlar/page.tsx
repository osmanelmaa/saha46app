'use client';

import { useMemo, useState } from 'react';
import { useVeri } from '@/lib/durum';
import { gecenSure, icerir, tarihSaat } from '@/lib/bicim';
import { BosHal, Rehber, Rozet } from '@/components/parcalar';

const HEDEF_ADI: Record<string, string> = {
  report: 'Şikayet',
  listing: 'İlan',
  profile: 'Kullanıcı',
  team: 'Takım',
  match: 'Maç',
  tournament: 'Turnuva',
  announcement: 'Duyuru',
};

export default function KayitlarSayfasi() {
  const veri = useVeri();
  const [arama, setArama] = useState('');
  const [islem, setIslem] = useState('hepsi');
  const [hedef, setHedef] = useState('hepsi');
  const [baslangic, setBaslangic] = useState('');

  const islemler = useMemo(
    () => [...new Set(veri.kayitlar.map((k) => k.action))].sort((a, b) => a.localeCompare(b, 'tr')),
    [veri.kayitlar],
  );

  const hedefTurleri = useMemo(
    () => [...new Set(veri.kayitlar.map((k) => k.targetType))].sort((a, b) => a.localeCompare(b, 'tr')),
    [veri.kayitlar],
  );

  const liste = useMemo(() => {
    const bas = baslangic ? Date.parse(`${baslangic}T00:00:00+03:00`) : null;
    return veri.kayitlar
      .filter((k) => (islem === 'hepsi' ? true : k.action === islem))
      .filter((k) => (hedef === 'hepsi' ? true : k.targetType === hedef))
      .filter((k) => (bas === null ? true : k.createdAt >= bas))
      .filter((k) => icerir(k.action, arama) || icerir(k.note ?? '', arama) || icerir(k.targetId, arama))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [veri.kayitlar, islem, hedef, baslangic, arama]);

  return (
    <>
      <div className="sayfa-basi">
        <div>
          <h1>İşlem kaydı</h1>
          <p>Panelde yapılan her işlem buraya düşer. Kayıtlar değiştirilemez.</p>
        </div>
        <Rozet>{veri.kayitlar.length} kayıt</Rozet>
      </div>

      <Rehber baslik="Bu kayıt neden önemli">
        Askıya alma, ilan kaldırma ve hesap silme gibi işlemler geri alınamaz. Bir kararın kim
        tarafından, ne zaman ve hangi gerekçeyle verildiği yalnızca burada görülür.
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
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>

          <div className="alan">
            <label htmlFor="hedef">Hedef türü</label>
            <select id="hedef" value={hedef} onChange={(e) => setHedef(e.target.value)}>
              <option value="hepsi">Hepsi</option>
              {hedefTurleri.map((h) => (
                <option key={h} value={h}>
                  {HEDEF_ADI[h] ?? h}
                </option>
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
                <BosHal baslik="Kayıt bulunamadı" aciklama="Filtreleri gevşetip tekrar deneyin." />
              )}
              {liste.map((k) => (
                <tr key={k.id}>
                  <td>
                    <strong>{tarihSaat(k.createdAt)}</strong>
                    <div className="silik" style={{ fontSize: 12 }}>{gecenSure(k.createdAt)}</div>
                  </td>
                  <td>{k.adminName}</td>
                  <td>
                    <strong>{k.action}</strong>
                  </td>
                  <td>
                    {HEDEF_ADI[k.targetType] ?? k.targetType}
                    <div className="silik" style={{ fontSize: 12 }}>{k.targetId}</div>
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
