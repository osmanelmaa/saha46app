'use client';

import { useMemo, useState } from 'react';
import { useVeri } from '@/lib/durum';
import { icerir, para, tarih, tarihSaat } from '@/lib/bicim';
import type { MacDurumu } from '@/lib/tipler';
import { YanPanel, Satir } from '@/components/YanPanel';
import { Arma, BosHal, HataKutusu, Rehber, Rozet, Yukleniyor } from '@/components/parcalar';

const DURUM_METNI: Record<MacDurumu, string> = {
  upcoming: 'Yaklaşan',
  played: 'Oynandı',
  cancelled: 'İptal',
};

export default function MaclarSayfasi() {
  const veri = useVeri();
  const [durum, setDurum] = useState<'hepsi' | MacDurumu>('hepsi');
  const [sonuc, setSonuc] = useState('hepsi');
  const [arama, setArama] = useState('');
  const [sadeceSorunlu, setSadeceSorunlu] = useState(false);
  const [seciliId, setSeciliId] = useState<string | null>(null);

  const takim = (id: string | null) => veri.takimlar.find((t) => t.id === id);

  /** Bu maç için verilmiş gelmeme bildirimleri. */
  const gelmemeler = (macId: string) =>
    veri.degerlendirmeler.filter((d) => d.match_id === macId && d.no_show);

  const liste = useMemo(
    () =>
      veri.maclar
        .filter((m) => (durum === 'hepsi' ? true : m.status === durum))
        .filter((m) => (sonuc === 'hepsi' ? true : m.result_status === sonuc))
        .filter((m) => {
          if (!sadeceSorunlu) return true;
          // Sorunlu maç: gelmeme bildirimi var, iptal edilmiş ya da sonucu çekişmeli.
          return gelmemeler(m.id).length > 0 || m.status === 'cancelled' || m.result_status === 'disputed';
        })
        .filter((m) => {
          if (!arama.trim()) return true;
          return (
            icerir(takim(m.home_team_id)?.name, arama) ||
            icerir(takim(m.away_team_id)?.name, arama) ||
            icerir(m.pitch, arama)
          );
        })
        .sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at)),
    [veri.maclar, veri.takimlar, veri.degerlendirmeler, durum, sonuc, arama, sadeceSorunlu],
  );

  const acik = seciliId ? veri.maclar.find((m) => m.id === seciliId) ?? null : null;

  const sorunluSayisi = veri.maclar.filter(
    (m) => gelmemeler(m.id).length > 0 || m.result_status === 'disputed',
  ).length;

  if (veri.yukleniyor && veri.maclar.length === 0) return <Yukleniyor />;

  return (
    <>
      <div className="sayfa-basi">
        <div>
          <h1>Maçlar</h1>
          <p>Kesinleşmiş maçlar, sonuçları ve sorunlu kayıtlar.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {sorunluSayisi > 0 && <Rozet ton="kirmizi">{sorunluSayisi} sorunlu</Rozet>}
          <Rozet ton="teal">{veri.maclar.length} maç</Rozet>
        </div>
      </div>

      {veri.hata && <HataKutusu hata={veri.hata} yenile={() => void veri.yenile()} />}

      <Rehber baslik="Nasıl çalışılır">
        Bu ekran maçları izlemek içindir; panelden maç oluşturulmaz ya da sonucu değiştirilmez —
        onlar uygulamadaki <code>accept_offer</code>, <code>report_match_result</code> ve{' '}
        <code>cancel_match</code> akışlarının işidir. <strong>Sorunlu</strong> süzgeci gelmeme
        bildirimi olan, iptal edilmiş ya da sonucu çekişmeli maçları getirir.
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
              placeholder="Örnek: Aslanbey, Yıldırım"
            />
          </div>

          <div className="alan">
            <label htmlFor="durum">Durum</label>
            <select id="durum" value={durum} onChange={(e) => setDurum(e.target.value as never)}>
              <option value="hepsi">Hepsi</option>
              <option value="upcoming">Yaklaşan</option>
              <option value="played">Oynandı</option>
              <option value="cancelled">İptal</option>
            </select>
          </div>

          <div className="alan">
            <label htmlFor="sonuc">Sonuç durumu</label>
            <select id="sonuc" value={sonuc} onChange={(e) => setSonuc(e.target.value)}>
              <option value="hepsi">Hepsi</option>
              <option value="pending">Bekliyor</option>
              <option value="confirmed">Onaylandı</option>
              <option value="disputed">Çekişmeli</option>
            </select>
          </div>

          <div className="alan">
            <label htmlFor="sorunlu">Süzgeç</label>
            <label className="etiket sonuk" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38 }}>
              <input
                id="sorunlu"
                type="checkbox"
                checked={sadeceSorunlu}
                onChange={(e) => setSadeceSorunlu(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              Yalnızca sorunlu
            </label>
          </div>

          <span className="filtre-ozet">{liste.length} kayıt</span>
        </div>

        <div className="tablo-sarmal">
          <table className="tablo">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Takımlar</th>
                <th>Saha</th>
                <th>Skor</th>
                <th>Durum</th>
                <th className="sag">Ayrıntı</th>
              </tr>
            </thead>
            <tbody>
              {liste.length === 0 && (
                <BosHal
                  baslik="Maç bulunamadı"
                  aciklama="Seçtiğiniz filtrelerle eşleşen maç yok. Henüz hiç maç kesinleşmemiş de olabilir."
                />
              )}
              {liste.map((m) => {
                const ev = takim(m.home_team_id);
                const dep = takim(m.away_team_id);
                const gelmeme = gelmemeler(m.id);
                const sorunlu = gelmeme.length > 0 || m.result_status === 'disputed';
                return (
                  <tr
                    key={m.id}
                    className={`tiklanir${acik?.id === m.id ? ' secili' : ''}${sorunlu ? ' oncelikli' : ''}`}
                    onClick={() => setSeciliId(m.id)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSeciliId(m.id);
                      }
                    }}
                  >
                    <td data-etiket="Tarih">
                      <strong>{m.date_text || tarih(m.starts_at)}</strong>
                      <div className="silik" style={{ fontSize: 12 }}>{m.time_text} · {m.format}</div>
                    </td>
                    <td data-etiket="Takımlar">
                      <span className="kimlik">
                        <Arma takim={ev} boyut={26} />
                        <span>
                          <span className="ad">{ev?.name ?? 'Bilinmeyen'}</span>
                          <div className="alt">{dep?.name ?? 'Bilinmeyen'}</div>
                        </span>
                      </span>
                    </td>
                    <td data-etiket="Saha">
                      {m.pitch}
                      <div className="silik" style={{ fontSize: 12 }}>{m.district}</div>
                    </td>
                    <td data-etiket="Skor">
                      {m.home_score !== null && m.away_score !== null ? (
                        <strong>{m.home_score} - {m.away_score}</strong>
                      ) : (
                        <span className="silik">—</span>
                      )}
                    </td>
                    <td data-etiket="Durum">
                      {m.status === 'played' ? (
                        <Rozet ton="yesil">Oynandı</Rozet>
                      ) : m.status === 'upcoming' ? (
                        <Rozet ton="teal">Yaklaşan</Rozet>
                      ) : (
                        <Rozet>İptal</Rozet>
                      )}
                      {gelmeme.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          <Rozet ton="kirmizi">gelmeme</Rozet>
                        </div>
                      )}
                      {m.result_status === 'disputed' && (
                        <div style={{ marginTop: 4 }}>
                          <Rozet ton="uyari">çekişmeli</Rozet>
                        </div>
                      )}
                    </td>
                    <td className="sag" data-etiket="Ayrıntı">
                      <span className="satir-ok" aria-hidden="true">Aç →</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <YanPanel
        acik={Boolean(acik)}
        kapat={() => setSeciliId(null)}
        baslik={acik ? `${takim(acik.home_team_id)?.name ?? '—'} — ${takim(acik.away_team_id)?.name ?? '—'}` : ''}
        altBaslik={acik ? `${acik.date_text} ${acik.time_text} · ${acik.pitch}` : undefined}
      >
        {acik && (
          <>
            {gelmemeler(acik.id).length > 0 && (
              <div className="kutu kirmizi" style={{ marginBottom: 16 }}>
                <h4>Gelmeme bildirimi var</h4>
                {gelmemeler(acik.id).map((d) => (
                  <div key={d.rater_team_id}>
                    {takim(d.rater_team_id)?.name ?? 'Bir takım'},{' '}
                    <strong>{takim(d.rated_team_id)?.name ?? '—'}</strong> takımını bildirdi.
                  </div>
                ))}
              </div>
            )}

            {acik.status === 'cancelled' && (
              <div className="kutu uyari" style={{ marginBottom: 16 }}>
                <h4>Maç iptal edildi</h4>
                {acik.cancel_reason || 'Gerekçe belirtilmemiş.'}
                {acik.cancelled_by && (
                  <div style={{ marginTop: 4 }}>
                    İptal eden: {takim(acik.cancelled_by)?.name ?? 'bilinmiyor'}
                  </div>
                )}
              </div>
            )}

            <h4 style={{ marginBottom: 10 }}>Maç bilgileri</h4>
            <dl className="satir-liste">
              <Satir baslik="Ev sahibi">
                <span className="kimlik">
                  <Arma takim={takim(acik.home_team_id)} boyut={26} />
                  <span className="ad">{takim(acik.home_team_id)?.name ?? '—'}</span>
                </span>
              </Satir>
              <Satir baslik="Deplasman">
                <span className="kimlik">
                  <Arma takim={takim(acik.away_team_id)} boyut={26} />
                  <span className="ad">{takim(acik.away_team_id)?.name ?? '—'}</span>
                </span>
              </Satir>
              <Satir baslik="Başlangıç">{tarihSaat(acik.starts_at)}</Satir>
              <Satir baslik="Saha">{acik.pitch} · {acik.district}</Satir>
              <Satir baslik="Format">{acik.format}</Satir>
              <Satir baslik="Ücret">{para(acik.fee)}</Satir>
              <Satir baslik="Durum">{DURUM_METNI[acik.status]}</Satir>
              <Satir baslik="Skor">
                {acik.home_score !== null && acik.away_score !== null
                  ? `${acik.home_score} - ${acik.away_score}`
                  : 'Girilmemiş'}
              </Satir>
              <Satir baslik="Sonuç durumu">
                {acik.result_status === 'confirmed' ? (
                  <Rozet ton="yesil">Onaylandı</Rozet>
                ) : acik.result_status === 'disputed' ? (
                  <Rozet ton="uyari">Çekişmeli</Rozet>
                ) : (
                  <Rozet>Bekliyor</Rozet>
                )}
              </Satir>
              {acik.reported_by && (
                <Satir baslik="Sonucu giren">{takim(acik.reported_by)?.name ?? '—'}</Satir>
              )}
              {acik.confirmed_at && <Satir baslik="Onay">{tarihSaat(acik.confirmed_at)}</Satir>}
              <Satir baslik="Oluşturulma">{tarihSaat(acik.created_at)}</Satir>
            </dl>

            <h4 style={{ margin: '22px 0 10px' }}>Değerlendirmeler</h4>
            <div className="kutu">
              {veri.degerlendirmeler.filter((d) => d.match_id === acik.id).length === 0 ? (
                'Bu maç için değerlendirme yapılmamış.'
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {veri.degerlendirmeler
                    .filter((d) => d.match_id === acik.id)
                    .map((d) => (
                      <li key={`${d.rater_team_id}-${d.rated_team_id}`} style={{ marginBottom: 4 }}>
                        {takim(d.rater_team_id)?.name ?? '—'} →{' '}
                        {takim(d.rated_team_id)?.name ?? '—'}:{' '}
                        {d.rating ? `${d.rating}/5` : 'puan yok'}
                        {d.no_show && ' · sahaya gelmedi'}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </>
        )}
      </YanPanel>
    </>
  );
}
