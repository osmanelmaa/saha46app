'use client';

import { useMemo, useState } from 'react';
import { useVeri } from '@/lib/durum';
import { gecenSure, tarih, tarihSaat } from '@/lib/bicim';
import type { Report, SikayetDurumu } from '@/lib/tipler';
import { OnayDiyalogu, type OnayIstegi } from '@/components/OnayDiyalogu';
import { YanPanel, Satir } from '@/components/YanPanel';
import {
  Arma,
  BosHal,
  Eylem,
  HataKutusu,
  Rehber,
  Rozet,
  SikayetRozeti,
  Yukleniyor,
  hedefMetni,
  sebepMetni,
} from '@/components/parcalar';

export default function SikayetlerSayfasi() {
  const veri = useVeri();
  const [durumSuzgeci, setDurumSuzgeci] = useState<'hepsi' | SikayetDurumu>('open');
  const [sebepSuzgeci, setSebepSuzgeci] = useState<string>('hepsi');
  const [baslangic, setBaslangic] = useState('');
  const [bitis, setBitis] = useState('');
  const [seciliId, setSeciliId] = useState<string | null>(null);
  const [onay, setOnay] = useState<OnayIstegi | null>(null);

  const kisi = (id: string | null) => veri.profiller.find((p) => p.id === id);
  const takim = (id: string) => veri.takimlar.find((t) => t.id === id);
  const ilan = (id: string) => veri.ilanlar.find((i) => i.id === id);

  const hedefAdi = (r: Report) => {
    if (r.target_type === 'team') return takim(r.target_id)?.name ?? 'Silinmiş takım';
    if (r.target_type === 'profile') {
      const p = kisi(r.target_id);
      return p?.name || p?.email || 'Silinmiş kullanıcı';
    }
    const i = ilan(r.target_id);
    return i ? `${i.pitch} · ${i.date_text} ${i.time_text}` : 'Kaldırılmış ilan';
  };

  const gecmis = (r: Report) =>
    veri.sikayetler.filter((x) => x.target_type === r.target_type && x.target_id === r.target_id);

  /** Şikayet sebepleri veride serbest metin; filtre seçenekleri veriden türetilir. */
  const sebepler = useMemo(
    () => [...new Set(veri.sikayetler.map((r) => r.reason))].sort((a, b) => a.localeCompare(b, 'tr')),
    [veri.sikayetler],
  );

  const liste = useMemo(() => {
    const bas = baslangic ? Date.parse(`${baslangic}T00:00:00+03:00`) : null;
    const bit = bitis ? Date.parse(`${bitis}T23:59:59+03:00`) : null;
    const sayi = (r: Report) =>
      veri.sikayetler.filter((x) => x.target_type === r.target_type && x.target_id === r.target_id).length;

    return veri.sikayetler
      .filter((r) => (durumSuzgeci === 'hepsi' ? true : r.status === durumSuzgeci))
      .filter((r) => (sebepSuzgeci === 'hepsi' ? true : r.reason === sebepSuzgeci))
      .filter((r) => {
        const t = Date.parse(r.created_at);
        return (bas === null || t >= bas) && (bit === null || t <= bit);
      })
      // Tekrar eden hedefler öne alınır; kuyruğun sırası kararın sırasıdır.
      .sort((a, b) => sayi(b) - sayi(a) || Date.parse(b.created_at) - Date.parse(a.created_at));
  }, [veri.sikayetler, durumSuzgeci, sebepSuzgeci, baslangic, bitis]);

  const acik = seciliId ? veri.sikayetler.find((r) => r.id === seciliId) ?? null : null;
  const acikSayisi = veri.sikayetler.filter((r) => r.status === 'open').length;
  const tekrarEden = veri.sikayetler.filter((r) => r.status === 'open' && gecmis(r).length > 1).length;

  const eylemler = acik
    ? [
        {
          ad: 'Uyarı gönder',
          ne: 'Şikayet çözüldü sayılır, gerekçe işlem kaydına yazılır.',
          tehlikeli: false,
          istek: (): OnayIstegi => ({
            baslik: 'Uyarı kaydı oluşturulsun mu?',
            aciklama: `${hedefAdi(acik)} için uyarı kaydedilecek ve şikayet kapanacak.`,
            onayMetni: 'Uyarı gönder',
            sonuclar: [
              'Şikayet "çözüldü" olarak kapanır.',
              'Gerekçe işlem kaydına yazılır.',
              'Uygulama içi bildirim gönderilmez — bildirim altyapısı panelde yok.',
            ],
            notEtiketi: 'Uyarı gerekçesi',
            notZorunlu: true,
            notOnerileri: [
              'İlan kurallarına aykırı davranış tespit edildi.',
              'Tekrarı hâlinde kısıtlama uygulanacaktır.',
            ],
            uygula: async (not) => {
              await veri.uyariGonder(acik.target_type, acik.target_id, not);
              await veri.sikayetiCoz(acik.id, 'Uyarı gönderildi.', not);
            },
          }),
        },
        ...(acik.target_type === 'listing' && ilan(acik.target_id)
          ? [
              {
                ad: 'İlanı kaldır',
                ne: 'İlan yayından kalkar, teklif alamaz.',
                tehlikeli: true,
                istek: (): OnayIstegi => ({
                  baslik: 'İlan kaldırılsın mı?',
                  aciklama: 'İlan yayından kaldırılacak.',
                  onayMetni: 'İlanı kaldır',
                  tehlikeli: true,
                  sonuclar: [
                    'İlan listelerden kalkar ve yeni teklif alamaz.',
                    'Kayıt silinmez; geçmiş ve şikayet bağı korunur.',
                    'Şikayet "çözüldü" olarak kapanır.',
                  ],
                  notEtiketi: 'Kaldırma gerekçesi',
                  notZorunlu: true,
                  notOnerileri: ['Sahte ilan', 'Spam', 'Yanıltıcı bilgi'],
                  uygula: async (not) => {
                    await veri.ilaniKaldir(acik.target_id, not);
                    await veri.sikayetiCoz(acik.id, 'İlan kaldırıldı.', not);
                  },
                }),
              },
            ]
          : []),
        ...(acik.target_type === 'profile' && kisi(acik.target_id)?.status === 'active'
          ? [
              {
                ad: 'Kullanıcıyı askıya al',
                ne: 'Hesap askıya alınır; uygulamada işlem yapamaz.',
                tehlikeli: true,
                istek: (): OnayIstegi => ({
                  baslik: 'Kullanıcı askıya alınsın mı?',
                  aciklama: `${hedefAdi(acik)} hesabı askıya alınacak.`,
                  onayMetni: 'Askıya al',
                  tehlikeli: true,
                  sonuclar: [
                    'Hesabın durumu "askıda" olur.',
                    'Askı panelden istendiği an kaldırılabilir.',
                    'Şikayet "çözüldü" olarak kapanır.',
                  ],
                  notEtiketi: 'Askıya alma gerekçesi',
                  notZorunlu: true,
                  notOnerileri: ['Tekrarlanan sahte ilan', 'Mesajlarda hakaret', 'Taciz'],
                  uygula: async (not) => {
                    await veri.kullaniciAskiyaAl(acik.target_id, not);
                    await veri.sikayetiCoz(acik.id, 'Kullanıcı askıya alındı.', not);
                  },
                }),
              },
            ]
          : []),
        ...(acik.target_type === 'team'
          ? [
              {
                ad: 'İlan kısıtı kaydet',
                ne: 'Kayda geçer; kısıtlama için şema desteği henüz yok.',
                tehlikeli: true,
                istek: (): OnayIstegi => ({
                  baslik: 'İlan kısıtı kaydedilsin mi?',
                  aciklama: `${hedefAdi(acik)} için kısıtlama kararı işlem kaydına yazılacak.`,
                  onayMetni: 'Kaydet',
                  tehlikeli: true,
                  sonuclar: [
                    'Karar işlem kaydına yazılır.',
                    'Takımın ilan vermesi teknik olarak ENGELLENMEZ — bunun için şemada kısıtlama alanı yok.',
                    'Şikayet "çözüldü" olarak kapanır.',
                  ],
                  notEtiketi: 'Kısıtlama gerekçesi ve süresi',
                  notZorunlu: true,
                  notOnerileri: ['İki hafta süreyle', 'Bir ay süreyle'],
                  uygula: async (not) => {
                    await veri.ilanKisiti(acik.target_id, not);
                    await veri.sikayetiCoz(acik.id, 'İlan verme kısıtı kaydedildi.', not);
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
              'Gerekçe kayda geçer.',
            ],
            notEtiketi: 'Ret gerekçesi',
            notZorunlu: true,
            notOnerileri: ['Kural ihlali bulunmadı.', 'Yeterli delil yok.', 'Mükerrer şikayet.'],
            uygula: async (not) => {
              await veri.sikayetiReddet(acik.id, not);
            },
          }),
        },
      ]
    : [];

  if (veri.yukleniyor && veri.sikayetler.length === 0) return <Yukleniyor />;

  return (
    <>
      <div className="sayfa-basi">
        <div>
          <h1>Şikayetler</h1>
          <p>Panelin ana iş kuyruğu. Her kaydı bir sonuca bağlayın.</p>
        </div>
        <Rozet ton={acikSayisi > 0 ? 'kirmizi' : 'yesil'}>{acikSayisi} açık kayıt</Rozet>
      </div>

      {veri.hata && <HataKutusu hata={veri.hata} yenile={() => void veri.yenile()} />}

      <Rehber baslik="Nasıl çalışılır">
        Satıra tıklayınca sağda ayrıntı paneli açılır: şikayetin metni, hedefin bilgileri ve daha
        önce kaç şikayet aldığı görünür. Karar verdiğinizde alttaki eylemlerden birini seçin — her
        biri gerekçe ister, kalıcıdır ve işlem kaydına düşer.
        {tekrarEden > 0 && (
          <>
            {' '}
            <strong>{tekrarEden} kayıt</strong> daha önce şikayet almış hedeflere ait; listede üstte
            ve kırmızı çizgiyle işaretli.
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
            <select id="sebep" value={sebepSuzgeci} onChange={(e) => setSebepSuzgeci(e.target.value)}>
              <option value="hepsi">Hepsi</option>
              {sebepler.map((s) => (
                <option key={s} value={s}>
                  {sebepMetni(s)}
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
                const adet = gecmis(r).length;
                const oncelikli = adet > 1 && r.status === 'open';
                return (
                  <tr
                    key={r.id}
                    className={`tiklanir${acik?.id === r.id ? ' secili' : ''}${oncelikli ? ' oncelikli' : ''}`}
                    onClick={() => setSeciliId(r.id)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSeciliId(r.id);
                      }
                    }}
                  >
                    <td data-etiket="Tarih">
                      <strong>{tarih(r.created_at)}</strong>
                      <div className="silik" style={{ fontSize: 12 }}>{gecenSure(r.created_at)}</div>
                    </td>
                    <td data-etiket="Hedef">
                      <span className="kimlik">
                        {r.target_type === 'team' && <Arma takim={takim(r.target_id)} boyut={30} />}
                        <span>
                          <span className="ad">{hedefAdi(r)}</span>
                          <div className="alt">
                            {hedefMetni(r.target_type)}
                            {adet > 1 && (
                              <>
                                {' · '}
                                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{adet}. şikayet</span>
                              </>
                            )}
                          </div>
                        </span>
                      </span>
                    </td>
                    <td data-etiket="Sebep">{sebepMetni(r.reason)}</td>
                    <td data-etiket="Şikayet eden">{kisi(r.reporter_id)?.name || <span className="silik">Bilinmeyen</span>}</td>
                    <td data-etiket="Durum">
                      <SikayetRozeti durum={r.status} />
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
        baslik={acik ? sebepMetni(acik.reason) : ''}
        altBaslik={acik ? `${hedefMetni(acik.target_type)}: ${hedefAdi(acik)}` : undefined}
        alt={
          acik && acik.status === 'open' ? (
            <>
              <h4 style={{ marginBottom: 10 }}>Ne yapılsın?</h4>
              <div className="eylem-liste">
                {eylemler.map((e) => (
                  <Eylem key={e.ad} ad={e.ad} ne={e.ne} tehlikeli={e.tehlikeli} tikla={() => setOnay(e.istek())} />
                ))}
              </div>
            </>
          ) : (
            <p className="etiket sonuk">Bu şikayet sonuçlandırılmış, yeni işlem gerekmiyor.</p>
          )
        }
      >
        {acik && (
          <>
            {gecmis(acik).length > 1 && (
              <div className="kutu kirmizi" style={{ marginBottom: 16 }}>
                <h4>Tekrar eden hedef</h4>
                Bu hedef hakkında toplam {gecmis(acik).length} şikayet var. Karar verirken geçmişi de
                dikkate alın.
              </div>
            )}

            <h4 style={{ marginBottom: 8 }}>Şikayet metni</h4>
            <div className="kutu" style={{ marginBottom: 20 }}>{acik.detail}</div>

            <h4 style={{ marginBottom: 10 }}>Bilgiler</h4>
            <dl className="satir-liste">
              <Satir baslik="Durum"><SikayetRozeti durum={acik.status} /></Satir>
              <Satir baslik="Bildiren">
                {kisi(acik.reporter_id)?.name || kisi(acik.reporter_id)?.email || 'Bilinmeyen'}
              </Satir>
              <Satir baslik="Bildirim tarihi">{tarihSaat(acik.created_at)}</Satir>

              {acik.target_type === 'listing' && (() => {
                const i = ilan(acik.target_id);
                if (!i) return <Satir baslik="İlan">Bulunamadı</Satir>;
                return (
                  <>
                    <Satir baslik="İlan">{i.pitch} · {i.district}</Satir>
                    <Satir baslik="Maç">{i.date_text} {i.time_text} · {i.format}</Satir>
                    <Satir baslik="Durum">
                      {i.is_open ? <Rozet ton="yesil">Yayında</Rozet> : <Rozet>Kaldırılmış</Rozet>}
                    </Satir>
                    <Satir baslik="İlan sahibi">{takim(i.team_id ?? '')?.name ?? '—'}</Satir>
                  </>
                );
              })()}

              {acik.target_type === 'profile' && (() => {
                const p = kisi(acik.target_id);
                if (!p) return <Satir baslik="Kullanıcı">Bulunamadı</Satir>;
                return (
                  <>
                    <Satir baslik="E-posta">{p.email ?? '—'}</Satir>
                    <Satir baslik="Hesap durumu">
                      {p.status === 'active' ? <Rozet ton="yesil">Etkin</Rozet> : <Rozet ton="kirmizi">Askıda</Rozet>}
                    </Satir>
                    <Satir baslik="Kayıt tarihi">{tarih(p.created_at)}</Satir>
                  </>
                );
              })()}

              {acik.target_type === 'team' && (() => {
                const t = takim(acik.target_id);
                if (!t) return <Satir baslik="Takım">Bulunamadı</Satir>;
                const gelmeme = veri.degerlendirmeler.filter((d) => d.no_show && d.rated_team_id === t.id).length;
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
                      {gelmeme > 0 ? <Rozet ton="kirmizi">{gelmeme} bildirim</Rozet> : <span className="silik">yok</span>}
                    </Satir>
                  </>
                );
              })()}

              {acik.resolution && <Satir baslik="Sonuç">{acik.resolution}</Satir>}
              {acik.resolved_at && <Satir baslik="Sonuçlandırma">{tarihSaat(acik.resolved_at)}</Satir>}
            </dl>

            <h4 style={{ margin: '22px 0 10px' }}>Hedefin şikayet geçmişi</h4>
            <div className="kutu">
              {gecmis(acik).length === 1 ? (
                'Bu hedef hakkındaki ilk şikayet.'
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {gecmis(acik)
                    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
                    .map((x) => (
                      <li key={x.id} style={{ marginBottom: 4 }}>
                        {tarih(x.created_at)} · {sebepMetni(x.reason)} ·{' '}
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
