'use client';

import { useMemo, useState } from 'react';
import { useVeri } from '@/lib/durum';
import { para } from '@/lib/bicim';
import { OnayDiyalogu, type OnayIstegi } from '@/components/OnayDiyalogu';
import { Arma, Rehber, Rozet } from '@/components/parcalar';

export default function GelmeyenlerSayfasi() {
  const veri = useVeri();
  const [onay, setOnay] = useState<OnayIstegi | null>(null);
  const [acikTakim, setAcikTakim] = useState<string | null>(null);

  /** Bildirimler takıma göre gruplanır; asıl karar takım düzeyinde verilir. */
  const gruplar = useMemo(() => {
    const bildirimler = veri.maclar.filter((m) => m.noShow);
    const harita = new Map<string, typeof bildirimler>();
    bildirimler.forEach((m) => {
      const mevcut = harita.get(m.opponentId) ?? [];
      harita.set(m.opponentId, [...mevcut, m]);
    });
    return [...harita.entries()]
      .map(([takimId, maclar]) => ({
        takim: veri.takimlar.find((t) => t.id === takimId),
        takimId,
        maclar: maclar.sort((a, b) => b.createdAt - a.createdAt),
      }))
      .sort((a, b) => b.maclar.length - a.maclar.length);
  }, [veri.maclar, veri.takimlar]);

  const toplam = gruplar.reduce((t, g) => t + g.maclar.length, 0);

  return (
    <>
      <div className="sayfa-basi">
        <div>
          <h1>Gelmeme bildirimleri</h1>
          <p>Sahaya gelmediği bildirilen takımlar. İki ve üzeri bildirim alanlar öne çıkarılır.</p>
        </div>
        <Rozet ton={toplam > 0 ? 'kirmizi' : 'yesil'}>{toplam} açık bildirim</Rozet>
      </div>

      <Rehber baslik="Nasıl çalışılır">
        Bildirimler kişi kişi değil, <strong>takım takım</strong> değerlendirilir: aynı takım
        birden fazla kez bildirilmişse yaptırım gerekir. Tek bildirim genelde uyarıyla kapatılır.
        Bildirimin haksız olduğunu düşünüyorsanız ilgili maçta "Geçersiz say" deyin.
      </Rehber>

      {gruplar.length === 0 && (
        <section className="kart">
          <div className="kart-govde">
            <div className="bos-hal">
              <div className="simge" aria-hidden="true">✓</div>
              <strong>Açık gelmeme bildirimi yok</strong>
              <p>Bir takım sahaya gelmediğinde rakibi bildirim oluşturur ve burada listelenir.</p>
            </div>
          </div>
        </section>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {gruplar.map((grup) => {
          const adet = grup.maclar.length;
          const tekrarci = adet >= 2;
          const acik = acikTakim === grup.takimId;

          return (
            <section className="kart" key={grup.takimId}>
              <div className="kart-basi">
                <div className="takim-hucre">
                  <Arma takim={grup.takim} boyut={38} />
                  <div>
                    <h2>{grup.takim?.name ?? 'Silinmiş takım'}</h2>
                    <div className="sonuk" style={{ fontSize: 12.5 }}>
                      {grup.takim ? `${grup.takim.district} · ${grup.takim.level} · ${grup.takim.format}` : '—'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Rozet ton={tekrarci ? 'kirmizi' : 'uyari'}>
                    {adet} bildirim{tekrarci ? ' · yaptırım gerekebilir' : ''}
                  </Rozet>
                  <button
                    type="button"
                    className="btn btn-sessiz btn-kucuk"
                    onClick={() => setAcikTakim(acik ? null : grup.takimId)}
                    aria-expanded={acik}
                  >
                    {acik ? 'Maçları gizle' : 'Maçları göster'}
                  </button>
                </div>
              </div>

              {acik && (
                <div className="tablo-sarmal">
                  <table className="tablo">
                    <thead>
                      <tr>
                        <th>Maç tarihi</th>
                        <th>Saha</th>
                        <th>Format</th>
                        <th>Ücret</th>
                        <th className="sag">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grup.maclar.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <strong>{m.date}</strong>
                            <div className="silik" style={{ fontSize: 12 }}>{m.time}</div>
                          </td>
                          <td>
                            {m.pitch}
                            <div className="silik" style={{ fontSize: 12 }}>{m.district}</div>
                          </td>
                          <td>{m.format}</td>
                          <td>{para(m.fee)}</td>
                          <td className="sag">
                            <button
                              type="button"
                              className="btn btn-cizgi btn-kucuk"
                              onClick={() =>
                                setOnay({
                                  baslik: 'Bildirim geçersiz sayılsın mı?',
                                  aciklama: `${m.date} tarihli maç için verilen gelmeme bildirimi kaldırılacak ve takımın kaydından düşecek.`,
                                  onayMetni: 'Geçersiz say',
                        sonuclar: [
                          'Bildirim takımın kaydından düşer.',
                          'Takımın gelmeme sayacı bir azalır.',
                          'İşlem kaydına gerekçesiyle yazılır.',
                        ],
                                  notEtiketi: 'Gerekçe',
                                  notZorunlu: true,
                                  notOnerileri: [
                                    'Karşı taraf önceden haber vermiş.',
                                    'Maç karşılıklı iptal edilmiş.',
                                    'Hatalı bildirim.',
                                  ],
                                  uygula: (not) => veri.gelmemeyiGecersizSay(m.id, not),
                                })
                              }
                            >
                              Geçersiz say
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="kart-govde" style={{ borderTop: '1px solid var(--line)' }}>
                {tekrarci && (
                  <div className="kutu kirmizi" style={{ marginBottom: 12 }}>
                    Bu takım hakkında {adet} ayrı gelmeme bildirimi var. İlan verme kısıtı
                    değerlendirilmelidir.
                  </div>
                )}
                <div className="btn-sira">
                  <button
                    type="button"
                    className="btn btn-tehlike btn-kucuk"
                    onClick={() =>
                      setOnay({
                        baslik: 'İlan vermesi kısıtlansın mı?',
                        aciklama: `${grup.takim?.name ?? 'Takım'} belirtilen süre boyunca yeni ilan veremeyecek.`,
                        onayMetni: 'Kısıtla',
                        tehlikeli: true,
                        sonuclar: [
                          'Takım yeni ilan veremez.',
                          'Kabul edilmiş maçları etkilenmez.',
                          'Takım yöneticisi bilgilendirilir.',
                        ],
                        notEtiketi: 'Kısıtlama gerekçesi ve süresi',
                        notZorunlu: true,
                        notOnerileri: ['İki hafta süreyle', 'Bir ay süreyle'],
                        uygula: (not) => veri.ilanKisiti(grup.takimId, not),
                      })
                    }
                  >
                    İlan vermeyi kısıtla
                  </button>
                  <button
                    type="button"
                    className="btn btn-cizgi btn-kucuk"
                    onClick={() =>
                      setOnay({
                        baslik: 'Uyarı gönderilsin mi?',
                        aciklama: `${grup.takim?.name ?? 'Takım'} yöneticisine uygulama içi uyarı gönderilecek.`,
                        onayMetni: 'Uyarı gönder',
                        sonuclar: [
                          'Takım yöneticisine uygulama içi bildirim gider.',
                          'Herhangi bir kısıtlama uygulanmaz.',
                        ],
                        notEtiketi: 'Uyarı metni',
                        notZorunlu: true,
                        notOnerileri: [
                          'Kabul edilen maça gelmemek diğer takımları mağdur ediyor.',
                          'Tekrarı hâlinde ilan verme kısıtı uygulanacaktır.',
                        ],
                        uygula: (not) => veri.uyariGonder('team', grup.takimId, not),
                      })
                    }
                  >
                    Uyarı gönder
                  </button>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <OnayDiyalogu istek={onay} kapat={() => setOnay(null)} />
    </>
  );
}
