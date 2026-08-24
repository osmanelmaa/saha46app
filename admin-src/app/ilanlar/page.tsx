'use client';

import { useMemo, useState } from 'react';
import { useVeri } from '@/lib/durum';
import { gecenSure, icerir, para, tarih } from '@/lib/bicim';
import { ILCELER } from '@/lib/mock/sabitler';
import type { Format, ListingKind } from '@/lib/tipler';
import { OnayDiyalogu, type OnayIstegi } from '@/components/OnayDiyalogu';
import { BosHal, IlanTuru, Rehber, Rozet, TUR_METNI, Arma } from '@/components/parcalar';

const TURLER: ListingKind[] = ['rakip', 'oyuncu', 'kaleci', 'turnuva', 'kiralik'];

export default function IlanlarSayfasi() {
  const veri = useVeri();
  const [arama, setArama] = useState('');
  const [tur, setTur] = useState<'hepsi' | ListingKind>('hepsi');
  const [ilce, setIlce] = useState<string>('hepsi');
  const [format, setFormat] = useState<'hepsi' | Format>('hepsi');
  const [sadeceAcil, setSadeceAcil] = useState(false);
  const [baslangic, setBaslangic] = useState('');
  const [onay, setOnay] = useState<OnayIstegi | null>(null);

  const takim = (id: string) => veri.takimlar.find((t) => t.id === id);

  const liste = useMemo(() => {
    const bas = baslangic ? Date.parse(`${baslangic}T00:00:00+03:00`) : null;
    return veri.ilanlar
      .filter((i) => (tur === 'hepsi' ? true : i.kind === tur))
      .filter((i) => (ilce === 'hepsi' ? true : i.district === ilce))
      .filter((i) => (format === 'hepsi' ? true : i.format === format))
      .filter((i) => (sadeceAcil ? Boolean(i.urgent) : true))
      .filter((i) => (bas === null ? true : i.createdAt >= bas))
      .filter((i) => {
        if (!arama.trim()) return true;
        // Arama takım adında ve saha adında, Türkçe karakterlere duyarlı yapılır.
        const takimAdi = takim(i.teamId)?.name ?? '';
        return icerir(takimAdi, arama) || icerir(i.pitch, arama) || icerir(i.playerName ?? '', arama);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [veri.ilanlar, veri.takimlar, tur, ilce, format, sadeceAcil, baslangic, arama]);

  return (
    <>
      <div className="sayfa-basi">
        <div>
          <h1>İlanlar</h1>
          <p>Yayındaki tüm ilanlar. Kurallara aykırı olanları gerekçesiyle kaldırın.</p>
        </div>
        <Rozet ton="teal">{veri.ilanlar.length} ilan</Rozet>
      </div>

      <Rehber baslik="Nasıl çalışılır">
        Bu ekran ilanları denetlemek içindir. Arama Türkçe karakterlere duyarlıdır: "sahin"
        yazarak "Şahin" bulunur. Bir ilanı kaldırmak geri alınamaz, bu yüzden gerekçe zorunludur.
      </Rehber>

      <section className="kart">
        <div className="filtreler">
          <div className="alan genis">
            <label htmlFor="arama">Takım ya da saha ara</label>
            <input
              id="arama"
              type="text"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Örnek: Yıldırım, Aslanbey"
            />
          </div>

          <div className="alan">
            <label htmlFor="tur">Tür</label>
            <select id="tur" value={tur} onChange={(e) => setTur(e.target.value as never)}>
              <option value="hepsi">Hepsi</option>
              {TURLER.map((t) => (
                <option key={t} value={t}>
                  {TUR_METNI[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="alan">
            <label htmlFor="ilce">İlçe</label>
            <select id="ilce" value={ilce} onChange={(e) => setIlce(e.target.value)}>
              <option value="hepsi">Hepsi</option>
              {ILCELER.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>

          <div className="alan">
            <label htmlFor="format">Format</label>
            <select id="format" value={format} onChange={(e) => setFormat(e.target.value as never)}>
              <option value="hepsi">Hepsi</option>
              <option value="7v7">7v7</option>
              <option value="8v8">8v8</option>
            </select>
          </div>

          <div className="alan">
            <label htmlFor="tarihten">Şu tarihten sonra</label>
            <input id="tarihten" type="date" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} />
          </div>

          <div className="alan">
            <label htmlFor="acil">Aciliyet</label>
            <label className="etiket sonuk" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}>
              <input
                id="acil"
                type="checkbox"
                checked={sadeceAcil}
                onChange={(e) => setSadeceAcil(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              Yalnızca acil
            </label>
          </div>

          <span className="filtre-ozet">{liste.length} kayıt</span>
        </div>

        <div className="tablo-sarmal">
          <table className="tablo">
            <thead>
              <tr>
                <th>İlan</th>
                <th>Tür</th>
                <th>Takım / kişi</th>
                <th>Maç</th>
                <th>Ücret</th>
                <th>Yayın</th>
                <th className="sag">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {liste.length === 0 && (
                <BosHal
                  baslik="İlan bulunamadı"
                  aciklama="Seçtiğiniz filtrelerle eşleşen ilan yok. Aramayı sadeleştirip tekrar deneyin."
                />
              )}
              {liste.map((i) => {
                const t = takim(i.teamId);
                return (
                  <tr key={i.id}>
                    <td>
                      <strong>{i.kind === 'kiralik' ? i.playerName : i.pitch}</strong>
                      <div className="silik" style={{ fontSize: 12 }}>
                        {i.district}
                        {i.urgent ? ' · ' : ''}
                        {i.urgent && <span style={{ color: 'var(--danger)', fontWeight: 700 }}>ACİL</span>}
                      </div>
                    </td>
                    <td>
                      <IlanTuru tur={i.kind} />
                      {i.positions && i.positions.length > 0 && (
                        <div className="silik" style={{ fontSize: 12, marginTop: 4 }}>{i.positions.join(', ')}</div>
                      )}
                    </td>
                    <td>
                      {i.kind === 'kiralik' ? (
                        <>
                          <strong>{i.playerName}</strong>
                          <div className="silik" style={{ fontSize: 12 }}>{i.age} yaşında</div>
                        </>
                      ) : (
                        <span className="takim-hucre">
                          <Arma takim={t} boyut={28} />
                          <span>
                            <strong>{t?.name ?? '—'}</strong>
                            <div className="silik" style={{ fontSize: 12 }}>{t?.level}</div>
                          </span>
                        </span>
                      )}
                    </td>
                    <td>
                      {i.date}
                      <div className="silik" style={{ fontSize: 12 }}>{i.time} · {i.format}</div>
                    </td>
                    <td>{i.fee > 0 ? para(i.fee) : <span className="silik">—</span>}</td>
                    <td>
                      {tarih(i.createdAt)}
                      <div className="silik" style={{ fontSize: 12 }}>{gecenSure(i.createdAt)}</div>
                    </td>
                    <td className="sag">
                      <button
                        type="button"
                        className="btn btn-cizgi btn-kucuk"
                        onClick={() =>
                          setOnay({
                            baslik: 'İlan kaldırılsın mı?',
                            aciklama: `${i.kind === 'kiralik' ? i.playerName : i.pitch} ilanı yayından kaldırılacak. İşlem kaydına gerekçesiyle düşer.`,
                            onayMetni: 'İlanı kaldır',
                            tehlikeli: true,
                            sonuclar: [
                              'İlan listelerden kalkar ve teklif alamaz.',
                              'İlan sahibi bildirim alır.',
                              'İşlem geri alınamaz.',
                            ],
                            notEtiketi: 'Kaldırma sebebi',
                            notZorunlu: true,
                            notOnerileri: [
                              'Sahte ilan',
                              'Spam / tekrarlanan ilan',
                              'Yanıltıcı bilgi',
                              'Uygunsuz içerik',
                            ],
                            uygula: (not) => veri.ilaniKaldir(i.id, not),
                          })
                        }
                      >
                        Kaldır
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <OnayDiyalogu istek={onay} kapat={() => setOnay(null)} />
    </>
  );
}
