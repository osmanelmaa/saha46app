'use client';

import { useMemo, useState } from 'react';
import { useVeri } from '@/lib/durum';
import { para, tarih } from '@/lib/bicim';
import { OnayDiyalogu, type OnayIstegi } from '@/components/OnayDiyalogu';
import { Arma, HataKutusu, Rehber, Rozet, Yukleniyor } from '@/components/parcalar';

export default function GelmeyenlerSayfasi() {
  const veri = useVeri();
  const [onay, setOnay] = useState<OnayIstegi | null>(null);
  const [acikTakim, setAcikTakim] = useState<string | null>(null);

  /**
   * Bildirimler match_ratings.no_show üzerinden okunur ve bildirilen takıma
   * göre gruplanır; karar takım düzeyinde verilir.
   */
  const gruplar = useMemo(() => {
    const bildirimler = veri.degerlendirmeler.filter((d) => d.no_show);
    const harita = new Map<string, typeof bildirimler>();
    bildirimler.forEach((d) => {
      harita.set(d.rated_team_id, [...(harita.get(d.rated_team_id) ?? []), d]);
    });
    return [...harita.entries()]
      .map(([takimId, kayitlar]) => ({
        takimId,
        takim: veri.takimlar.find((t) => t.id === takimId),
        kayitlar: kayitlar.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
      }))
      .sort((a, b) => b.kayitlar.length - a.kayitlar.length);
  }, [veri.degerlendirmeler, veri.takimlar]);

  const toplam = gruplar.reduce((t, g) => t + g.kayitlar.length, 0);
  const mac = (id: string) => veri.maclar.find((m) => m.id === id);

  if (veri.yukleniyor && veri.degerlendirmeler.length === 0) return <Yukleniyor />;

  return (
    <>
      <div className="sayfa-basi">
        <div>
          <h1>Gelmeme bildirimleri</h1>
          <p>Sahaya gelmediği bildirilen takımlar. İki ve üzeri bildirim alanlar öne çıkarılır.</p>
        </div>
        <Rozet ton={toplam > 0 ? 'kirmizi' : 'yesil'}>{toplam} bildirim</Rozet>
      </div>

      {veri.hata && <HataKutusu hata={veri.hata} yenile={() => void veri.yenile()} />}

      <Rehber baslik="Nasıl çalışılır">
        Bildirimler kişi kişi değil, <strong>takım takım</strong> değerlendirilir: aynı takım birden
        fazla kez bildirilmişse yaptırım gerekir. Bildirimi maç sonrası rakip takım oluşturur.
      </Rehber>

      <div className="kutu uyari" style={{ marginBottom: 20 }}>
        <h4>Bildirim geçersiz sayma şu an yapılamıyor</h4>
        <code>match_ratings</code> tablosunun yazma politikası yalnızca bildirimi oluşturan takımın
        üyelerini kabul ediyor; <code>with check</code> koşulunda <code>is_admin()</code> yok. Haksız
        bir bildirimi kaldırmak için mobil tarafta yeni bir migration gerekiyor.
      </div>

      {gruplar.length === 0 && (
        <section className="kart">
          <div className="kart-govde">
            <div className="bos-hal">
              <div className="simge" aria-hidden="true">✓</div>
              <strong>Gelmeme bildirimi yok</strong>
              <p>Bir takım sahaya gelmediğinde rakibi bildirim oluşturur ve burada listelenir.</p>
            </div>
          </div>
        </section>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {gruplar.map((grup) => {
          const adet = grup.kayitlar.length;
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
                        <th>Bildiren takım</th>
                        <th>Ücret</th>
                        <th>Bildirim</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grup.kayitlar.map((d) => {
                        const m = mac(d.match_id);
                        const bildiren = veri.takimlar.find((t) => t.id === d.rater_team_id);
                        return (
                          <tr key={`${d.match_id}-${d.rater_team_id}`}>
                            <td data-etiket="Maç tarihi">
                              <strong>{m?.date_text ?? tarih(m?.starts_at)}</strong>
                              <div className="silik" style={{ fontSize: 12 }}>{m?.time_text ?? '—'}</div>
                            </td>
                            <td data-etiket="Saha">
                              {m?.pitch ?? '—'}
                              <div className="silik" style={{ fontSize: 12 }}>{m?.district ?? ''}</div>
                            </td>
                            <td data-etiket="Bildiren takım">
                              <span className="takim-hucre">
                                <Arma takim={bildiren} boyut={26} />
                                <span>{bildiren?.name ?? '—'}</span>
                              </span>
                            </td>
                            <td data-etiket="Ücret">{para(m?.fee)}</td>
                            <td data-etiket="Bildirim">{tarih(d.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="kart-govde" style={{ borderTop: '1px solid var(--line)' }}>
                {tekrarci && (
                  <div className="kutu kirmizi" style={{ marginBottom: 12 }}>
                    Bu takım hakkında {adet} ayrı gelmeme bildirimi var. Yaptırım değerlendirilmelidir.
                  </div>
                )}
                <div className="btn-sira">
                  <button
                    type="button"
                    className="btn btn-cizgi btn-kucuk"
                    onClick={() =>
                      setOnay({
                        baslik: 'Uyarı kaydı oluşturulsun mu?',
                        aciklama: `${grup.takim?.name ?? 'Takım'} için uyarı işlem kaydına yazılacak.`,
                        onayMetni: 'Uyarı gönder',
                        sonuclar: [
                          'Karar işlem kaydına yazılır.',
                          'Uygulama içi bildirim gönderilmez — bildirim altyapısı panelde yok.',
                        ],
                        notEtiketi: 'Uyarı gerekçesi',
                        notZorunlu: true,
                        notOnerileri: [
                          'Kabul edilen maça gelmemek diğer takımları mağdur ediyor.',
                          'Tekrarı hâlinde kısıtlama uygulanacaktır.',
                        ],
                        uygula: async (not) => {
                          await veri.uyariGonder('team', grup.takimId, not);
                        },
                      })
                    }
                  >
                    Uyarı kaydet
                  </button>
                  <button
                    type="button"
                    className="btn btn-tehlike btn-kucuk"
                    onClick={() =>
                      setOnay({
                        baslik: 'İlan kısıtı kaydedilsin mi?',
                        aciklama: `${grup.takim?.name ?? 'Takım'} için kısıtlama kararı işlem kaydına yazılacak.`,
                        onayMetni: 'Kaydet',
                        tehlikeli: true,
                        sonuclar: [
                          'Karar işlem kaydına yazılır.',
                          'Takımın ilan vermesi teknik olarak ENGELLENMEZ — şemada kısıtlama alanı yok.',
                        ],
                        notEtiketi: 'Kısıtlama gerekçesi ve süresi',
                        notZorunlu: true,
                        notOnerileri: ['İki hafta süreyle', 'Bir ay süreyle'],
                        uygula: async (not) => {
                          await veri.ilanKisiti(grup.takimId, not);
                        },
                      })
                    }
                  >
                    İlan kısıtı kaydet
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
