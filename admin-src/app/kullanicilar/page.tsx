'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useVeri } from '@/lib/durum';
import { icerir, tarih } from '@/lib/bicim';
import { OnayDiyalogu, type OnayIstegi } from '@/components/OnayDiyalogu';
import { Arma, BosHal, Rehber, Rozet } from '@/components/parcalar';

export default function KullanicilarSayfasi() {
  const veri = useVeri();
  const [sekme, setSekme] = useState<'kullanicilar' | 'takimlar'>('kullanicilar');
  const [arama, setArama] = useState('');
  const [durum, setDurum] = useState<'hepsi' | 'active' | 'suspended'>('hepsi');
  const [onay, setOnay] = useState<OnayIstegi | null>(null);

  const takim = (id?: string) => (id ? veri.takimlar.find((t) => t.id === id) : undefined);

  const kullanicilar = useMemo(
    () =>
      veri.profiller
        .filter((p) => (durum === 'hepsi' ? true : p.status === durum))
        .filter((p) => icerir(p.name, arama) || icerir(p.email, arama))
        .sort((a, b) => b.createdAt - a.createdAt),
    [veri.profiller, durum, arama],
  );

  /** Takım tablosundaki sayılar oynanmış maçlardan hesaplanır. */
  const takimlar = useMemo(
    () =>
      veri.takimlar
        .filter((t) => icerir(t.name, arama) || icerir(t.district, arama))
        .map((t) => {
          const maclar = veri.maclar.filter((m) => m.opponentId === t.id && m.status === 'played');
          const puanlar = maclar.map((m) => m.rating).filter((r): r is number => typeof r === 'number');
          const ortalama = puanlar.length
            ? (puanlar.reduce((x, y) => x + y, 0) / puanlar.length).toFixed(1)
            : '—';
          return {
            takim: t,
            uye: veri.profiller.filter((p) => p.teamId === t.id).length,
            oynanan: maclar.length,
            ortalama,
            gelmeme: veri.maclar.filter((m) => m.noShow && m.opponentId === t.id).length,
            sikayet: veri.sikayetler.filter((r) => r.targetType === 'team' && r.targetId === t.id).length,
          };
        })
        .sort((a, b) => b.gelmeme - a.gelmeme || b.oynanan - a.oynanan),
    [veri.takimlar, veri.maclar, veri.profiller, veri.sikayetler, arama],
  );

  return (
    <>
      <div className="sayfa-basi">
        <div>
          <h1>Kullanıcılar ve takımlar</h1>
          <p>Hesapları ve takım kayıtlarını görüntüleyin, gerektiğinde kısıtlayın.</p>
        </div>
      </div>

      <Rehber baslik="Nasıl çalışılır">
        Ad ya da takıma tıklayarak detay sayfasını açın: o kaydın ilanları, maçları, aldığı
        şikayetler ve hakkında yapılmış işlemler orada bir arada görünür. Takım tablosundaki
        kırmızı rozetler yaptırım gerekebilecek takımları işaret eder.
      </Rehber>

      <div className="sekmeler" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={sekme === 'kullanicilar'}
          className={`sekme${sekme === 'kullanicilar' ? ' etkin' : ''}`}
          onClick={() => setSekme('kullanicilar')}
        >
          Kullanıcılar ({veri.profiller.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={sekme === 'takimlar'}
          className={`sekme${sekme === 'takimlar' ? ' etkin' : ''}`}
          onClick={() => setSekme('takimlar')}
        >
          Takımlar ({veri.takimlar.length})
        </button>
      </div>

      <section className="kart">
        <div className="filtreler">
          <div className="alan genis">
            <label htmlFor="arama">Ara</label>
            <input
              id="arama"
              type="text"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder={sekme === 'kullanicilar' ? 'Ad ya da e-posta' : 'Takım adı ya da ilçe'}
            />
          </div>

          {sekme === 'kullanicilar' && (
            <div className="alan">
              <label htmlFor="durum">Hesap durumu</label>
              <select id="durum" value={durum} onChange={(e) => setDurum(e.target.value as never)}>
                <option value="hepsi">Hepsi</option>
                <option value="active">Etkin</option>
                <option value="suspended">Askıda</option>
              </select>
            </div>
          )}

          <span className="filtre-ozet">
            {sekme === 'kullanicilar' ? kullanicilar.length : takimlar.length} kayıt
          </span>
        </div>

        <div className="bolum-not">
          {sekme === 'kullanicilar'
            ? 'Yönetici hesapları askıya alınamaz ve silinemez.'
            : 'Ortalama puan yalnızca oynanmış maçlardan hesaplanır.'}
        </div>

        <div className="tablo-sarmal">
          {sekme === 'kullanicilar' ? (
            <table className="tablo">
              <thead>
                <tr>
                  <th>Ad</th>
                  <th>E-posta</th>
                  <th>Takım</th>
                  <th>Durum</th>
                  <th>Kayıt tarihi</th>
                  <th className="sag">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {kullanicilar.length === 0 && (
                  <BosHal baslik="Kullanıcı bulunamadı" aciklama="Arama ya da durum filtresini değiştirip tekrar deneyin." />
                )}
                {kullanicilar.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/kullanicilar/${p.id}`}>
                        <strong>{p.name}</strong>
                      </Link>
                      {p.role === 'admin' && (
                        <div style={{ marginTop: 4 }}>
                          <Rozet ton="dolu">Yönetici</Rozet>
                        </div>
                      )}
                    </td>
                    <td>{p.email}</td>
                    <td>{takim(p.teamId)?.name ?? <span className="silik">Takımsız</span>}</td>
                    <td>
                      {p.status === 'active' ? (
                        <Rozet ton="yesil">Etkin</Rozet>
                      ) : (
                        <>
                          <Rozet ton="kirmizi">Askıda</Rozet>
                          {p.suspendedReason && (
                            <div className="silik" style={{ fontSize: 12, marginTop: 4 }}>{p.suspendedReason}</div>
                          )}
                        </>
                      )}
                    </td>
                    <td>{tarih(p.createdAt)}</td>
                    <td className="sag">
                      <div className="btn-sira" style={{ justifyContent: 'flex-end' }}>
                        {p.status === 'active' ? (
                          <button
                            type="button"
                            className="btn btn-cizgi btn-kucuk"
                            disabled={p.role === 'admin'}
                            onClick={() =>
                              setOnay({
                                baslik: 'Hesap askıya alınsın mı?',
                                aciklama: `${p.name} ilan veremeyecek, teklif gönderemeyecek ve mesajlaşamayacak.`,
                                onayMetni: 'Askıya al',
                                tehlikeli: true,
                                sonuclar: [
                                  'Kullanıcı ilan veremez, teklif gönderemez.',
                                  'Mevcut ilanları yayından kalkar.',
                                  'Askı istendiği an kaldırılabilir.',
                                ],
                                notEtiketi: 'Askıya alma gerekçesi',
                                notZorunlu: true,
                                notOnerileri: ['Tekrarlanan sahte ilan', 'Hakaret', 'Taciz', 'Spam'],
                                uygula: (not) => veri.kullaniciAskiyaAl(p.id, not),
                              })
                            }
                          >
                            Askıya al
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-cizgi btn-kucuk"
                            onClick={() =>
                              setOnay({
                                baslik: 'Askı kaldırılsın mı?',
                                aciklama: `${p.name} yeniden ilan verebilecek ve teklif gönderebilecek.`,
                                onayMetni: 'Askıyı kaldır',
                                sonuclar: ['Hesap yeniden etkin olur.', 'Kullanıcı ilan verebilir.'],
                                notEtiketi: 'Not',
                                uygula: () => veri.kullaniciAskisiniKaldir(p.id),
                              })
                            }
                          >
                            Askıyı kaldır
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sessiz btn-kucuk"
                          disabled={p.role === 'admin'}
                          onClick={() =>
                            setOnay({
                              baslik: 'Hesap silinsin mi?',
                              aciklama: `${p.name} hesabı ve kişisel verileri kalıcı olarak silinecek. Bu işlem geri alınamaz ve genellikle KVKK talebi üzerine yapılır.`,
                              onayMetni: 'Hesabı sil',
                              tehlikeli: true,
                              sonuclar: [
                                'Hesap ve kişisel veriler kalıcı olarak silinir.',
                                'Oynanmış maç kayıtları anonim hale gelir.',
                                'Bu işlem geri alınamaz.',
                              ],
                              notEtiketi: 'Talep kaynağı',
                              notZorunlu: true,
                              notOnerileri: ['KVKK silme talebi', 'Kullanıcı isteği'],
                              uygula: (not) => veri.kullaniciSil(p.id, not),
                            })
                          }
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="tablo">
              <thead>
                <tr>
                  <th>Takım</th>
                  <th>İlçe</th>
                  <th>Seviye</th>
                  <th>Üye</th>
                  <th>Oynanan maç</th>
                  <th>Ortalama puan</th>
                  <th className="sag">Uyarı işaretleri</th>
                </tr>
              </thead>
              <tbody>
                {takimlar.length === 0 && (
                  <BosHal baslik="Takım bulunamadı" aciklama="Aramayı sadeleştirip tekrar deneyin." />
                )}
                {takimlar.map((s) => (
                  <tr key={s.takim.id}>
                    <td>
                      <span className="takim-hucre">
                        <Arma takim={s.takim} />
                        <span>
                          <Link href={`/kullanicilar/takim-${s.takim.id}`}>
                            <strong>{s.takim.name}</strong>
                          </Link>
                          <div className="silik" style={{ fontSize: 12 }}>
                            {s.takim.code} · {s.takim.format}
                          </div>
                        </span>
                      </span>
                    </td>
                    <td>{s.takim.district}</td>
                    <td>{s.takim.level}</td>
                    <td>{s.uye}</td>
                    <td>{s.oynanan}</td>
                    <td>{s.ortalama}</td>
                    <td className="sag">
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {s.gelmeme > 0 && <Rozet ton="kirmizi">{s.gelmeme} gelmeme</Rozet>}
                        {s.sikayet > 0 && <Rozet ton="uyari">{s.sikayet} şikayet</Rozet>}
                        {s.gelmeme === 0 && s.sikayet === 0 && <span className="silik">temiz</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <OnayDiyalogu istek={onay} kapat={() => setOnay(null)} />
    </>
  );
}
