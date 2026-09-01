'use client';

import { useMemo, useState } from 'react';
import { useVeri } from '@/lib/durum';
import { gecenSure, icerir, para, tarih } from '@/lib/bicim';
import type { Format, IlanTuru } from '@/lib/tipler';
import { OnayDiyalogu, type OnayIstegi } from '@/components/OnayDiyalogu';
import {
  Arma,
  BosHal,
  HataKutusu,
  IlanTuruRozeti,
  Rehber,
  Rozet,
  TUR_METNI,
  Yukleniyor,
} from '@/components/parcalar';

const TURLER: IlanTuru[] = ['rakip', 'oyuncu', 'kaleci', 'turnuva', 'kiralik'];

export default function IlanlarSayfasi() {
  const veri = useVeri();
  const [arama, setArama] = useState('');
  const [tur, setTur] = useState<'hepsi' | IlanTuru>('hepsi');
  const [ilce, setIlce] = useState('hepsi');
  const [format, setFormat] = useState<'hepsi' | Format>('hepsi');
  const [sadeceAcil, setSadeceAcil] = useState(false);
  const [sadeceYayinda, setSadeceYayinda] = useState(true);
  const [onay, setOnay] = useState<OnayIstegi | null>(null);

  const takim = (id: string | null) => veri.takimlar.find((t) => t.id === id);

  /** İlçe listesi veriden türetilir; sabit liste tutmak şemayla ayrışır. */
  const ilceler = useMemo(
    () => [...new Set(veri.ilanlar.map((i) => i.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr')),
    [veri.ilanlar],
  );

  const liste = useMemo(
    () =>
      veri.ilanlar
        .filter((i) => (tur === 'hepsi' ? true : i.kind === tur))
        .filter((i) => (ilce === 'hepsi' ? true : i.district === ilce))
        .filter((i) => (format === 'hepsi' ? true : i.format === format))
        .filter((i) => (sadeceAcil ? i.urgent : true))
        .filter((i) => (sadeceYayinda ? i.is_open : true))
        .filter((i) => {
          if (!arama.trim()) return true;
          // Arama Türkçe karakterlere duyarlı: "sahin" ile "Şahin" eşleşir.
          return (
            icerir(takim(i.team_id)?.name, arama) ||
            icerir(i.pitch, arama) ||
            icerir(i.player_name, arama)
          );
        })
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
    [veri.ilanlar, veri.takimlar, tur, ilce, format, sadeceAcil, sadeceYayinda, arama],
  );

  const yayindaSayisi = veri.ilanlar.filter((i) => i.is_open).length;

  if (veri.yukleniyor && veri.ilanlar.length === 0) return <Yukleniyor />;

  return (
    <>
      <div className="sayfa-basi">
        <div>
          <h1>İlanlar</h1>
          <p>Yayındaki tüm ilanlar. Kurallara aykırı olanları gerekçesiyle kaldırın.</p>
        </div>
        <Rozet ton="teal">{yayindaSayisi} yayında</Rozet>
      </div>

      {veri.hata && <HataKutusu hata={veri.hata} yenile={() => void veri.yenile()} />}

      <Rehber baslik="Nasıl çalışılır">
        Arama Türkçe karakterlere duyarlıdır: "sahin" yazarak "Şahin" bulunur. İlanı kaldırmak onu
        yayından çıkarır ama <strong>satırı silmez</strong> — geçmiş ve şikayet bağı korunur.
      </Rehber>

      <section className="kart">
        <div className="filtreler">
          <div className="alan genis">
            <label htmlFor="arama">Takım, saha ya da oyuncu ara</label>
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
                <option key={t} value={t}>{TUR_METNI[t]}</option>
              ))}
            </select>
          </div>

          <div className="alan">
            <label htmlFor="ilce">İlçe</label>
            <select id="ilce" value={ilce} onChange={(e) => setIlce(e.target.value)}>
              <option value="hepsi">Hepsi</option>
              {ilceler.map((i) => (
                <option key={i} value={i}>{i}</option>
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
            <label htmlFor="acil">Süzgeçler</label>
            <label className="etiket sonuk" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}>
              <input
                id="acil"
                type="checkbox"
                checked={sadeceAcil}
                onChange={(e) => setSadeceAcil(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              Acil
            </label>
          </div>

          <div className="alan">
            <label htmlFor="yayinda">&nbsp;</label>
            <label className="etiket sonuk" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}>
              <input
                id="yayinda"
                type="checkbox"
                checked={sadeceYayinda}
                onChange={(e) => setSadeceYayinda(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              Yalnızca yayında
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
                const t = takim(i.team_id);
                return (
                  <tr key={i.id}>
                    <td>
                      <strong>{i.kind === 'kiralik' ? i.player_name ?? 'Kiralık oyuncu' : i.pitch}</strong>
                      <div className="silik" style={{ fontSize: 12 }}>
                        {i.district}
                        {i.urgent && (
                          <> · <span style={{ color: 'var(--danger)', fontWeight: 700 }}>ACİL</span></>
                        )}
                        {!i.is_open && <> · <span style={{ fontWeight: 700 }}>kaldırılmış</span></>}
                      </div>
                    </td>
                    <td>
                      <IlanTuruRozeti tur={i.kind} />
                      {i.positions && i.positions.length > 0 && (
                        <div className="silik" style={{ fontSize: 12, marginTop: 4 }}>{i.positions.join(', ')}</div>
                      )}
                    </td>
                    <td>
                      {i.kind === 'kiralik' ? (
                        <>
                          <strong>{i.player_name ?? '—'}</strong>
                          <div className="silik" style={{ fontSize: 12 }}>{i.age ? `${i.age} yaşında` : ''}</div>
                        </>
                      ) : (
                        <span className="takim-hucre">
                          <Arma takim={t} boyut={28} />
                          <span>
                            <strong>{t?.name ?? '—'}</strong>
                            <div className="silik" style={{ fontSize: 12 }}>{t?.level ?? ''}</div>
                          </span>
                        </span>
                      )}
                    </td>
                    <td>
                      {i.date_text}
                      <div className="silik" style={{ fontSize: 12 }}>{i.time_text} · {i.format}</div>
                    </td>
                    <td>{i.fee > 0 ? para(i.fee) : <span className="silik">—</span>}</td>
                    <td>
                      {tarih(i.created_at)}
                      <div className="silik" style={{ fontSize: 12 }}>{gecenSure(i.created_at)}</div>
                    </td>
                    <td className="sag">
                      {i.is_open ? (
                        <button
                          type="button"
                          className="btn btn-cizgi btn-kucuk"
                          onClick={() =>
                            setOnay({
                              baslik: 'İlan kaldırılsın mı?',
                              aciklama: `${i.kind === 'kiralik' ? i.player_name : i.pitch} ilanı yayından kaldırılacak.`,
                              onayMetni: 'İlanı kaldır',
                              tehlikeli: true,
                              sonuclar: [
                                'İlan listelerden kalkar ve yeni teklif alamaz.',
                                'Satır silinmez; geçmiş korunur.',
                                'Gerekçe işlem kaydına yazılır.',
                              ],
                              notEtiketi: 'Kaldırma sebebi',
                              notZorunlu: true,
                              notOnerileri: ['Sahte ilan', 'Spam / tekrarlanan ilan', 'Yanıltıcı bilgi', 'Uygunsuz içerik'],
                              uygula: async (not) => {
                                await veri.ilaniKaldir(i.id, not);
                              },
                            })
                          }
                        >
                          Kaldır
                        </button>
                      ) : (
                        <span className="silik">kaldırılmış</span>
                      )}
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
