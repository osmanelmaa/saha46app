'use client';

/** Kullanıcı ya da takım detay ekranı. Kimliği "p3" veya "takim-t3" biçimindedir. */

import Link from 'next/link';
import { useState } from 'react';
import { useVeri } from '@/lib/durum';
import { para, tarih, tarihSaat } from '@/lib/bicim';
import { OnayDiyalogu, type OnayIstegi } from '@/components/OnayDiyalogu';
import { Arma, BosHal, IlanTuru, Rozet, SEBEP_METNI, SikayetDurumu } from '@/components/parcalar';

export function KayitDetay({ kimlik }: { kimlik: string }) {
  const veri = useVeri();
  const [onay, setOnay] = useState<OnayIstegi | null>(null);

  const takimMi = kimlik.startsWith('takim-');
  const takimId = takimMi ? kimlik.slice('takim-'.length) : undefined;

  const kullanici = takimMi ? undefined : veri.profiller.find((p) => p.id === kimlik);
  const takim = takimMi
    ? veri.takimlar.find((t) => t.id === takimId)
    : kullanici?.teamId
      ? veri.takimlar.find((t) => t.id === kullanici.teamId)
      : undefined;

  if (!kullanici && !takim) {
    return (
      <>
        <div className="sayfa-basi">
          <div>
            <h1>Kayıt bulunamadı</h1>
            <p>Bu kayıt silinmiş olabilir.</p>
          </div>
          <Link className="btn btn-cizgi" href="/kullanicilar">
            Listeye dön
          </Link>
        </div>
      </>
    );
  }

  const hedefTuru = takimMi ? 'team' : 'profile';
  const hedefId = takimMi ? takimId! : kullanici!.id;

  const ilanlar = takim ? veri.ilanlar.filter((i) => i.teamId === takim.id) : [];
  const maclar = takim ? veri.maclar.filter((m) => m.opponentId === takim.id) : [];
  const sikayetler = veri.sikayetler.filter(
    (r) => r.targetType === hedefTuru && r.targetId === hedefId,
  );
  const uyeler = takim ? veri.profiller.filter((p) => p.teamId === takim.id) : [];

  const oynanan = maclar.filter((m) => m.status === 'played');
  const puanlar = oynanan.map((m) => m.rating).filter((r): r is number => typeof r === 'number');
  const ortalama = puanlar.length ? (puanlar.reduce((a, b) => a + b, 0) / puanlar.length).toFixed(1) : '—';
  const gelmeme = maclar.filter((m) => m.noShow).length;

  return (
    <>
      <div className="sayfa-basi">
        <div>
          <div className="etiket sonuk" style={{ marginBottom: 6 }}>
            <Link href="/kullanicilar">Kullanıcılar ve takımlar</Link> /{' '}
            {takimMi ? 'Takım' : 'Kullanıcı'}
          </div>
          <div className="takim-hucre">
            {takimMi && <Arma takim={takim} boyut={44} />}
            <div>
              <h1>{takimMi ? takim!.name : kullanici!.name}</h1>
              <p>
                {takimMi
                  ? `${takim!.district} · ${takim!.level} · ${takim!.format} · ${takim!.code}`
                  : kullanici!.email}
              </p>
            </div>
          </div>
        </div>

        <div className="btn-sira">
          {!takimMi && kullanici!.status === 'active' && kullanici!.role !== 'admin' && (
            <button
              type="button"
              className="btn btn-tehlike"
              onClick={() =>
                setOnay({
                  baslik: 'Hesap askıya alınsın mı?',
                  aciklama: `${kullanici!.name} ilan veremeyecek ve teklif gönderemeyecek.`,
                  onayMetni: 'Askıya al',
                  tehlikeli: true,
                  notEtiketi: 'Askıya alma gerekçesi',
                  notZorunlu: true,
                  notOnerileri: ['Tekrarlanan sahte ilan', 'Hakaret', 'Taciz'],
                  uygula: (not) => veri.kullaniciAskiyaAl(kullanici!.id, not),
                })
              }
            >
              Askıya al
            </button>
          )}
          {!takimMi && kullanici!.status === 'suspended' && (
            <button
              type="button"
              className="btn btn-cizgi"
              onClick={() =>
                setOnay({
                  baslik: 'Askı kaldırılsın mı?',
                  aciklama: `${kullanici!.name} yeniden ilan verebilecek.`,
                  onayMetni: 'Askıyı kaldır',
                  notEtiketi: 'Not',
                  uygula: () => veri.kullaniciAskisiniKaldir(kullanici!.id),
                })
              }
            >
              Askıyı kaldır
            </button>
          )}
          {takimMi && (
            <button
              type="button"
              className="btn btn-tehlike"
              onClick={() =>
                setOnay({
                  baslik: 'İlan vermesi kısıtlansın mı?',
                  aciklama: `${takim!.name} belirtilen süre boyunca yeni ilan veremeyecek.`,
                  onayMetni: 'Kısıtla',
                  tehlikeli: true,
                  notEtiketi: 'Kısıtlama gerekçesi ve süresi',
                  notZorunlu: true,
                  notOnerileri: ['İki hafta süreyle', 'Bir ay süreyle'],
                  uygula: (not) => veri.ilanKisiti(takim!.id, not),
                })
              }
            >
              İlan vermeyi kısıtla
            </button>
          )}
          <button
            type="button"
            className="btn btn-cizgi"
            onClick={() =>
              setOnay({
                baslik: 'Uyarı gönderilsin mi?',
                aciklama: 'Uygulama içi uyarı gönderilecek ve işlem kaydına düşecek.',
                onayMetni: 'Uyarı gönder',
                notEtiketi: 'Uyarı metni',
                notZorunlu: true,
                uygula: (not) => veri.uyariGonder(hedefTuru, hedefId, not),
              })
            }
          >
            Uyarı gönder
          </button>
        </div>
      </div>

      {!takimMi && kullanici!.status === 'suspended' && (
        <div className="kutu kirmizi" style={{ marginBottom: 20 }}>
          <h4>Hesap askıda</h4>
          {kullanici!.suspendedReason ?? 'Gerekçe belirtilmemiş.'}
          {kullanici!.suspendedAt ? ` · ${tarih(kullanici!.suspendedAt)}` : ''}
        </div>
      )}

      <div className="sayilar">
        {takimMi ? (
          <>
            <SayiKutu baslik="Üye" deger={uyeler.length} />
            <SayiKutu baslik="Oynanan maç" deger={oynanan.length} />
            <SayiKutu baslik="Ortalama puan" deger={ortalama} />
            <SayiKutu baslik="Gelmeme bildirimi" deger={gelmeme} vurgu={gelmeme > 0} />
          </>
        ) : (
          <>
            <SayiKutu baslik="Takımı" deger={takim ? takim.short : '—'} />
            <SayiKutu baslik="Aldığı şikayet" deger={sikayetler.length} vurgu={sikayetler.length > 0} />
            <SayiKutu baslik="Kayıt tarihi" deger={tarih(kullanici!.createdAt)} />
            <SayiKutu baslik="Rol" deger={kullanici!.role === 'admin' ? 'Yönetici' : 'Kullanıcı'} />
          </>
        )}
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        <section className="kart">
          <div className="kart-basi">
            <h2>Aldığı şikayetler</h2>
            <Rozet ton={sikayetler.length > 0 ? 'uyari' : 'yesil'}>{sikayetler.length}</Rozet>
          </div>
          <div className="tablo-sarmal">
            <table className="tablo">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Sebep</th>
                  <th>Açıklama</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {sikayetler.length === 0 && <BosHal baslik="Şikayet yok" aciklama="Bu kayıt hakkında bildirim yapılmamış." sutun={4} />}
                {sikayetler
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((r) => (
                    <tr key={r.id}>
                      <td>{tarih(r.createdAt)}</td>
                      <td>{SEBEP_METNI[r.reason]}</td>
                      <td>{r.detail}</td>
                      <td>
                        <SikayetDurumu durum={r.status} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {takim && (
          <>
            <section className="kart">
              <div className="kart-basi">
                <h2>İlanları</h2>
                <Rozet ton="teal">{ilanlar.length}</Rozet>
              </div>
              <div className="tablo-sarmal">
                <table className="tablo">
                  <thead>
                    <tr>
                      <th>Tür</th>
                      <th>Saha</th>
                      <th>Maç</th>
                      <th>Ücret</th>
                      <th>Yayın</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ilanlar.length === 0 && <BosHal baslik="Yayında ilan yok" aciklama="Takım şu an ilan vermiyor." sutun={5} />}
                    {ilanlar
                      .sort((a, b) => b.createdAt - a.createdAt)
                      .map((i) => (
                        <tr key={i.id}>
                          <td>
                            <IlanTuru tur={i.kind} />
                          </td>
                          <td>
                            {i.pitch}
                            <div className="silik" style={{ fontSize: 12 }}>{i.district}</div>
                          </td>
                          <td>
                            {i.date}
                            <div className="silik" style={{ fontSize: 12 }}>{i.time} · {i.format}</div>
                          </td>
                          <td>{i.fee > 0 ? para(i.fee) : '—'}</td>
                          <td>{tarih(i.createdAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="kart">
              <div className="kart-basi">
                <h2>Maçları</h2>
                <Rozet>{maclar.length}</Rozet>
              </div>
              <div className="tablo-sarmal">
                <table className="tablo">
                  <thead>
                    <tr>
                      <th>Tarih</th>
                      <th>Saha</th>
                      <th>Durum</th>
                      <th>Sonuç</th>
                      <th>Puan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maclar.length === 0 && <BosHal baslik="Maç kaydı yok" aciklama="Henüz oynanmış ya da planlanmış maç bulunmuyor." sutun={5} />}
                    {maclar
                      .sort((a, b) => b.createdAt - a.createdAt)
                      .map((m) => (
                        <tr key={m.id}>
                          <td>
                            {m.date}
                            <div className="silik" style={{ fontSize: 12 }}>{m.time}</div>
                          </td>
                          <td>{m.pitch}</td>
                          <td>
                            {m.noShow ? (
                              <Rozet ton="kirmizi">Sahaya gelmedi</Rozet>
                            ) : m.status === 'played' ? (
                              <Rozet ton="yesil">Oynandı</Rozet>
                            ) : m.status === 'upcoming' ? (
                              <Rozet ton="teal">Yaklaşan</Rozet>
                            ) : (
                              <Rozet>İptal</Rozet>
                            )}
                          </td>
                          <td>{m.result ? `${m.result.us} - ${m.result.them}` : '—'}</td>
                          <td>{m.rating ? `${m.rating}/5` : '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>

            {takimMi && (
              <section className="kart">
                <div className="kart-basi">
                  <h2>Üyeler</h2>
                  <Rozet>{uyeler.length}</Rozet>
                </div>
                <div className="tablo-sarmal">
                  <table className="tablo">
                    <thead>
                      <tr>
                        <th>Ad</th>
                        <th>E-posta</th>
                        <th>Durum</th>
                        <th>Kayıt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uyeler.length === 0 && <BosHal baslik="Üye yok" aciklama="Takıma katılım koduyla kimse katılmamış." sutun={4} />}
                      {uyeler.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <Link href={`/kullanicilar/${p.id}`}>
                              <strong>{p.name}</strong>
                            </Link>
                          </td>
                          <td>{p.email}</td>
                          <td>
                            {p.status === 'active' ? (
                              <Rozet ton="yesil">Etkin</Rozet>
                            ) : (
                              <Rozet ton="kirmizi">Askıda</Rozet>
                            )}
                          </td>
                          <td>{tarih(p.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

        <section className="kart">
          <div className="kart-basi">
            <h2>Bu kayıtla ilgili işlemler</h2>
          </div>
          <div className="mini-liste">
            {veri.kayitlar.filter((k) => k.targetId === hedefId).length === 0 && (
              <div className="mini-oge">
                <div className="govde">
                  <p>Kayıtlı işlem yok.</p>
                </div>
              </div>
            )}
            {veri.kayitlar
              .filter((k) => k.targetId === hedefId)
              .map((k) => (
                <div className="mini-oge" key={k.id}>
                  <div className="govde">
                    <strong>{k.action}</strong>
                    <p>
                      {k.adminName}
                      {k.note ? ` · ${k.note}` : ''}
                    </p>
                  </div>
                  <time>{tarihSaat(k.createdAt)}</time>
                </div>
              ))}
          </div>
        </section>
      </div>

      <OnayDiyalogu istek={onay} kapat={() => setOnay(null)} />
    </>
  );
}

function SayiKutu({ baslik, deger, vurgu }: { baslik: string; deger: string | number; vurgu?: boolean }) {
  return (
    <div className={`sayi-kart${vurgu ? ' vurgu' : ''}`}>
      <div className="ust">{baslik}</div>
      <div className="deger" style={{ fontSize: typeof deger === 'string' && deger.length > 6 ? 20 : undefined }}>
        {deger}
      </div>
    </div>
  );
}
