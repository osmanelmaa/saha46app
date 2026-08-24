'use client';

import { useMemo, useState } from 'react';
import { useVeri } from '@/lib/durum';
import { gecenSure, tarih, tarihSaat } from '@/lib/bicim';
import type { Report } from '@/lib/tipler';
import { OnayDiyalogu, type OnayIstegi } from '@/components/OnayDiyalogu';
import { YanPanel, Satir } from '@/components/YanPanel';
import {
  Arma,
  BosHal,
  Eylem,
  HEDEF_METNI,
  Rehber,
  Rozet,
  SEBEP_METNI,
  SikayetDurumu,
} from '@/components/parcalar';

const SEBEPLER: Report['reason'][] = ['sahte-ilan', 'hakaret', 'taciz', 'spam', 'diger'];

export default function SikayetlerSayfasi() {
  const veri = useVeri();
  const [durumSuzgeci, setDurumSuzgeci] = useState<'hepsi' | Report['status']>('open');
  const [sebepSuzgeci, setSebepSuzgeci] = useState<'hepsi' | Report['reason']>('hepsi');
  const [baslangic, setBaslangic] = useState('');
  const [bitis, setBitis] = useState('');
  const [secili, setSecili] = useState<Report | null>(null);
  const [onay, setOnay] = useState<OnayIstegi | null>(null);

  const kisi = (id: string) => veri.profiller.find((p) => p.id === id);
  const takim = (id: string) => veri.takimlar.find((t) => t.id === id);
  const ilan = (id: string) => veri.ilanlar.find((i) => i.id === id);

  const hedefAdi = (r: Report) => {
    if (r.targetType === 'team') return takim(r.targetId)?.name ?? 'Silinmiş takım';
    if (r.targetType === 'profile') return kisi(r.targetId)?.name ?? 'Silinmiş kullanıcı';
    const i = ilan(r.targetId);
    return i ? `${i.pitch} · ${i.date} ${i.time}` : 'Kaldırılmış ilan';
  };

  /** Hedefin daha önce kaç şikayet aldığı — kararı verirken en önemli bilgi. */
  const hedefGecmisi = (r: Report) =>
    veri.sikayetler.filter((x) => x.targetType === r.targetType && x.targetId === r.targetId);

  const liste = useMemo(() => {
    const bas = baslangic ? Date.parse(`${baslangic}T00:00:00+03:00`) : null;
    const bit = bitis ? Date.parse(`${bitis}T23:59:59+03:00`) : null;
    const sayisi = (r: Report) =>
      veri.sikayetler.filter((x) => x.targetType === r.targetType && x.targetId === r.targetId).length;

    return veri.sikayetler
      .filter((r) => (durumSuzgeci === 'hepsi' ? true : r.status === durumSuzgeci))
      .filter((r) => (sebepSuzgeci === 'hepsi' ? true : r.reason === sebepSuzgeci))
      .filter((r) => (bas === null || r.createdAt >= bas) && (bit === null || r.createdAt <= bit))
      // Tekrar eden hedefler öne alınır; kuyruğun sırası kararın sırasıdır.
      .sort((a, b) => sayisi(b) - sayisi(a) || b.createdAt - a.createdAt);
  }, [veri.sikayetler, durumSuzgeci, sebepSuzgeci, baslangic, bitis]);

  const acikSayisi = veri.sikayetler.filter((r) => r.status === 'open').length;
  const tekrarEdenler = useMemo(() => {
    const acik = veri.sikayetler.filter((r) => r.status === 'open');
    return acik.filter((r) => hedefGecmisi(r).length > 1).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [veri.sikayetler]);

  // Yan panel açıkken listedeki güncel kaydı göster.
  const acikKayit = secili ? veri.sikayetler.find((r) => r.id === secili.id) ?? null : null;
  const kapat = () => setSecili(null);

  const eylemler = acikKayit
    ? [
        {
          ad: 'Uyarı gönder',
          ne: 'Hedefe uygulama içi uyarı gider, şikayet çözüldü sayılır.',
          tehlikeli: false,
          istek: (): OnayIstegi => ({
            baslik: 'Uyarı gönderilsin mi?',
            aciklama: `${hedefAdi(acikKayit)} hedefine uyarı gönderilecek.`,
            onayMetni: 'Uyarı gönder',
            sonuclar: [
              'Hedefe uygulama içi bildirim gider.',
              'Şikayet "çözüldü" olarak kapanır.',
              'İşlem kaydına yazdığınız gerekçeyle düşer.',
            ],
            notEtiketi: 'Uyarı metni',
            notZorunlu: true,
            notOnerileri: [
              'İlan kurallarına aykırı davranış tespit edildi.',
              'Sahaya gelmeme bildirimi alındı, tekrarı hâlinde kısıtlama uygulanır.',
            ],
            uygula: (not) => {
              veri.uyariGonder(acikKayit.targetType, acikKayit.targetId, not);
              veri.sikayetiCoz(acikKayit.id, 'Uyarı gönderildi.', not);
            },
          }),
        },
        ...(acikKayit.targetType === 'listing' && ilan(acikKayit.targetId)
          ? [
              {
                ad: 'İlanı kaldır',
                ne: 'İlan yayından çıkar, bir daha görünmez.',
                tehlikeli: true,
                istek: (): OnayIstegi => ({
                  baslik: 'İlan kaldırılsın mı?',
                  aciklama: 'İlan yayından kaldırılacak.',
                  onayMetni: 'İlanı kaldır',
                  tehlikeli: true,
                  sonuclar: [
                    'İlan listelerden kaldırılır.',
                    'İlan sahibi bildirim alır.',
                    'Şikayet "çözüldü" olarak kapanır.',
                  ],
                  notEtiketi: 'Kaldırma gerekçesi',
                  notZorunlu: true,
                  notOnerileri: ['Sahte ilan', 'Spam', 'Yanıltıcı bilgi'],
                  uygula: (not) => {
                    veri.ilaniKaldir(acikKayit.targetId, not);
                    veri.sikayetiCoz(acikKayit.id, 'İlan kaldırıldı.', not);
                  },
                }),
              },
            ]
          : []),
        ...(acikKayit.targetType === 'profile' && kisi(acikKayit.targetId)?.status === 'active'
          ? [
              {
                ad: 'Kullanıcıyı askıya al',
                ne: 'Hesap kapanır; ilan veremez, teklif gönderemez.',
                tehlikeli: true,
                istek: (): OnayIstegi => ({
                  baslik: 'Kullanıcı askıya alınsın mı?',
                  aciklama: `${hedefAdi(acikKayit)} hesabı askıya alınacak.`,
                  onayMetni: 'Askıya al',
                  tehlikeli: true,
                  sonuclar: [
                    'Kullanıcı ilan veremez ve teklif gönderemez.',
                    'Mevcut ilanları yayında kalmaz.',
                    'Askı, panelden istendiği an kaldırılabilir.',
                  ],
                  notEtiketi: 'Askıya alma gerekçesi',
                  notZorunlu: true,
                  notOnerileri: ['Tekrarlanan sahte ilan', 'Mesajlarda hakaret', 'Taciz'],
                  uygula: (not) => {
                    veri.kullaniciAskiyaAl(acikKayit.targetId, not);
                    veri.sikayetiCoz(acikKayit.id, 'Kullanıcı askıya alındı.', not);
                  },
                }),
              },
            ]
          : []),
        ...(acikKayit.targetType === 'team'
          ? [
              {
                ad: 'İlan vermeyi kısıtla',
                ne: 'Takım belirtilen süre boyunca yeni ilan veremez.',
                tehlikeli: true,
                istek: (): OnayIstegi => ({
                  baslik: 'Takımın ilan vermesi kısıtlansın mı?',
                  aciklama: `${hedefAdi(acikKayit)} bir süre yeni ilan veremeyecek.`,
                  onayMetni: 'Kısıtla',
                  tehlikeli: true,
                  sonuclar: [
                    'Takım yeni ilan veremez.',
                    'Mevcut maçları etkilenmez.',
                    'Takım yöneticisi bilgilendirilir.',
                  ],
                  notEtiketi: 'Kısıtlama gerekçesi ve süresi',
                  notZorunlu: true,
                  notOnerileri: ['İki hafta süreyle', 'Bir ay süreyle'],
                  uygula: (not) => {
                    veri.ilanKisiti(acikKayit.targetId, not);
                    veri.sikayetiCoz(acikKayit.id, 'İlan verme kısıtlandı.', not);
                  },
                }),
              },
            ]
          : []),
        {
          ad: 'Şikayeti reddet',
          ne: 'Kural ihlali yoksa işlem yapılmadan kapatılır.',
          tehlikeli: false,
          istek: (): OnayIstegi => ({
            baslik: 'Şikayet reddedilsin mi?',
            aciklama: 'Şikayet işlem yapılmadan kapatılacak.',
            onayMetni: 'Reddet',
            sonuclar: [
              'Hedefe hiçbir yaptırım uygulanmaz.',
              'Şikayet "reddedildi" olarak kapanır.',
              'Şikayet eden kullanıcı sonucu görür.',
            ],
            notEtiketi: 'Ret gerekçesi',
            notZorunlu: true,
            notOnerileri: ['Kural ihlali bulunmadı.', 'Yeterli delil yok.', 'Mükerrer şikayet.'],
            uygula: (not) => veri.sikayetiReddet(acikKayit.id, not),
          }),
        },
      ]
    : [];

  return (
    <>
      <div className="sayfa-basi">
        <div>
          <h1>Şikayetler</h1>
          <p>Panelin ana iş kuyruğu. Her kaydı bir sonuca bağlayın.</p>
        </div>
        <Rozet ton={acikSayisi > 0 ? 'kirmizi' : 'yesil'}>{acikSayisi} açık kayıt</Rozet>
      </div>

      <Rehber baslik="Nasıl çalışılır">
        Satıra tıklayınca sağda ayrıntı paneli açılır: şikayetin metni, hedefin bilgileri ve daha
        önce kaç şikayet aldığı görünür. Karar verdiğinizde alttaki eylemlerden birini seçin — her
        biri gerekçe ister ve işlem kaydına düşer.
        {tekrarEdenler > 0 && (
          <>
            {' '}
            <strong>{tekrarEdenler} kayıt</strong> daha önce şikayet almış hedeflere ait; bunlar
            listede üstte ve kırmızı çizgiyle işaretli.
          </>
        )}
      </Rehber>

      <section className="kart">
        <div className="filtreler">
          <div className="alan">
            <label htmlFor="durum">Durum</label>
            <select id="durum" value={durumSuzgeci} onChange={(e) => setDurumSuzgeci(e.target.value as never)}>
              <option value="open">Açık</option>
              <option value="resolved">Çözüldü</option>
              <option value="dismissed">Reddedildi</option>
              <option value="hepsi">Hepsi</option>
            </select>
          </div>

          <div className="alan">
            <label htmlFor="sebep">Sebep</label>
            <select id="sebep" value={sebepSuzgeci} onChange={(e) => setSebepSuzgeci(e.target.value as never)}>
              <option value="hepsi">Hepsi</option>
              {SEBEPLER.map((s) => (
                <option key={s} value={s}>
                  {SEBEP_METNI[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="alan">
            <label htmlFor="bas">Başlangıç</label>
            <input id="bas" type="date" value={baslangic} onChange={(e) => setBaslangic(e.target.value)} />
          </div>

          <div className="alan">
            <label htmlFor="bit">Bitiş</label>
            <input id="bit" type="date" value={bitis} onChange={(e) => setBitis(e.target.value)} />
          </div>

          {(baslangic || bitis || sebepSuzgeci !== 'hepsi' || durumSuzgeci !== 'open') && (
            <button
              type="button"
              className="btn btn-sessiz btn-kucuk"
              onClick={() => {
                setDurumSuzgeci('open');
                setSebepSuzgeci('hepsi');
                setBaslangic('');
                setBitis('');
              }}
            >
              Filtreleri temizle
            </button>
          )}

          <span className="filtre-ozet">{liste.length} kayıt</span>
        </div>

        <div className="tablo-sarmal">
          <table className="tablo">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Hedef</th>
                <th>Sebep</th>
                <th>Şikayet eden</th>
                <th>Durum</th>
                <th className="sag">Ayrıntı</th>
              </tr>
            </thead>
            <tbody>
              {liste.length === 0 && (
                <BosHal
                  baslik="Kayıt bulunamadı"
                  aciklama="Seçtiğiniz filtrelerle eşleşen şikayet yok. Filtreleri temizleyip tekrar deneyin."
                />
              )}
              {liste.map((r) => {
                const gecmis = hedefGecmisi(r).length;
                const oncelikli = gecmis > 1 && r.status === 'open';
                return (
                  <tr
                    key={r.id}
                    className={`tiklanir${acikKayit?.id === r.id ? ' secili' : ''}${oncelikli ? ' oncelikli' : ''}`}
                    onClick={() => setSecili(r)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSecili(r);
                      }
                    }}
                  >
                    <td>
                      <strong>{tarih(r.createdAt)}</strong>
                      <div className="silik" style={{ fontSize: 12 }}>{gecenSure(r.createdAt)}</div>
                    </td>
                    <td>
                      <span className="kimlik">
                        {r.targetType === 'team' && <Arma takim={takim(r.targetId)} boyut={30} />}
                        <span>
                          <span className="ad">{hedefAdi(r)}</span>
                          <div className="alt">
                            {HEDEF_METNI[r.targetType]}
                            {gecmis > 1 && (
                              <>
                                {' · '}
                                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                                  {gecmis}. şikayet
                                </span>
                              </>
                            )}
                          </div>
                        </span>
                      </span>
                    </td>
                    <td>{SEBEP_METNI[r.reason]}</td>
                    <td>{kisi(r.reporterId)?.name ?? 'Silinmiş kullanıcı'}</td>
                    <td>
                      <SikayetDurumu durum={r.status} />
                    </td>
                    <td className="sag">
                      <span className="satir-ok" aria-hidden="true">
                        Aç →
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <YanPanel
        acik={Boolean(acikKayit)}
        kapat={kapat}
        baslik={acikKayit ? SEBEP_METNI[acikKayit.reason] : ''}
        altBaslik={acikKayit ? `${HEDEF_METNI[acikKayit.targetType]}: ${hedefAdi(acikKayit)}` : undefined}
        alt={
          acikKayit && acikKayit.status === 'open' ? (
            <>
              <h4 style={{ marginBottom: 10 }}>Ne yapılsın?</h4>
              <div className="eylem-liste">
                {eylemler.map((e) => (
                  <Eylem
                    key={e.ad}
                    ad={e.ad}
                    ne={e.ne}
                    tehlikeli={e.tehlikeli}
                    tikla={() => setOnay(e.istek())}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="etiket sonuk">Bu şikayet sonuçlandırılmış, yeni işlem gerekmiyor.</p>
          )
        }
      >
        {acikKayit && (
          <>
            {hedefGecmisi(acikKayit).length > 1 && (
              <div className="kutu kirmizi" style={{ marginBottom: 16 }}>
                <h4>Tekrar eden hedef</h4>
                Bu hedef hakkında toplam {hedefGecmisi(acikKayit).length} şikayet var. Karar
                verirken geçmişi de dikkate alın.
              </div>
            )}

            <h4 style={{ marginBottom: 8 }}>Şikayet metni</h4>
            <div className="kutu" style={{ marginBottom: 20 }}>
              {acikKayit.detail}
            </div>

            <h4 style={{ marginBottom: 10 }}>Bilgiler</h4>
            <dl className="satir-liste">
              <Satir baslik="Durum">
                <SikayetDurumu durum={acikKayit.status} />
              </Satir>
              <Satir baslik="Bildiren">{kisi(acikKayit.reporterId)?.name ?? 'Silinmiş kullanıcı'}</Satir>
              <Satir baslik="Bildirim tarihi">{tarihSaat(acikKayit.createdAt)}</Satir>
              {acikKayit.targetType === 'listing' &&
                (() => {
                  const i = ilan(acikKayit.targetId);
                  if (!i) return <Satir baslik="İlan">Kaldırılmış</Satir>;
                  return (
                    <>
                      <Satir baslik="İlan">
                        {i.pitch} · {i.district}
                      </Satir>
                      <Satir baslik="Maç">
                        {i.date} {i.time} · {i.format}
                      </Satir>
                      <Satir baslik="İlan sahibi">{takim(i.teamId)?.name ?? '—'}</Satir>
                    </>
                  );
                })()}
              {acikKayit.targetType === 'profile' &&
                (() => {
                  const p = kisi(acikKayit.targetId);
                  if (!p) return <Satir baslik="Kullanıcı">Silinmiş</Satir>;
                  return (
                    <>
                      <Satir baslik="E-posta">{p.email}</Satir>
                      <Satir baslik="Takımı">{p.teamId ? takim(p.teamId)?.name ?? '—' : 'Takımsız'}</Satir>
                      <Satir baslik="Hesap durumu">
                        {p.status === 'active' ? (
                          <Rozet ton="yesil">Etkin</Rozet>
                        ) : (
                          <Rozet ton="kirmizi">Askıda</Rozet>
                        )}
                      </Satir>
                      <Satir baslik="Kayıt tarihi">{tarih(p.createdAt)}</Satir>
                    </>
                  );
                })()}
              {acikKayit.targetType === 'team' &&
                (() => {
                  const t = takim(acikKayit.targetId);
                  if (!t) return <Satir baslik="Takım">Silinmiş</Satir>;
                  const gelmeme = veri.maclar.filter((m) => m.noShow && m.opponentId === t.id).length;
                  return (
                    <>
                      <Satir baslik="Takım">
                        <span className="kimlik">
                          <Arma takim={t} boyut={28} />
                          <span className="ad">{t.name}</span>
                        </span>
                      </Satir>
                      <Satir baslik="İlçe">{t.district}</Satir>
                      <Satir baslik="Seviye">{t.level}</Satir>
                      <Satir baslik="Format">{t.format}</Satir>
                      <Satir baslik="Gelmeme">
                        {gelmeme > 0 ? (
                          <Rozet ton="kirmizi">{gelmeme} bildirim</Rozet>
                        ) : (
                          <span className="silik">yok</span>
                        )}
                      </Satir>
                    </>
                  );
                })()}
              {acikKayit.resolution && <Satir baslik="Sonuç">{acikKayit.resolution}</Satir>}
              {acikKayit.resolvedAt && <Satir baslik="Sonuçlandırma">{tarihSaat(acikKayit.resolvedAt)}</Satir>}
            </dl>

            <h4 style={{ margin: '22px 0 10px' }}>Hedefin şikayet geçmişi</h4>
            <div className="kutu">
              {hedefGecmisi(acikKayit).length === 1 ? (
                'Bu hedef hakkındaki ilk şikayet.'
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {hedefGecmisi(acikKayit)
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((x) => (
                      <li key={x.id} style={{ marginBottom: 4 }}>
                        {tarih(x.createdAt)} · {SEBEP_METNI[x.reason]} ·{' '}
                        {x.status === 'open' ? 'açık' : x.status === 'resolved' ? 'çözüldü' : 'reddedildi'}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </>
        )}
      </YanPanel>

      <OnayDiyalogu istek={onay} kapat={() => setOnay(null)} />
    </>
  );
}
