'use client';

import { useState } from 'react';
import { useVeri } from '@/lib/durum';
import { para, tarih } from '@/lib/bicim';
import { ILCELER } from '@/lib/mock/sabitler';
import type { Format } from '@/lib/tipler';
import { OnayDiyalogu, type OnayIstegi } from '@/components/OnayDiyalogu';
import { Arma, BosHal, Rehber, Rozet } from '@/components/parcalar';

const BOS_FORM = {
  name: '',
  organizer: '',
  format: '7v7' as Format,
  quota: 16,
  fee: 0,
  prize: '',
  startDate: '',
  pitch: '',
  district: ILCELER[0] as string,
};

export default function TurnuvalarSayfasi() {
  const veri = useVeri();
  const [onay, setOnay] = useState<OnayIstegi | null>(null);
  const [formAcik, setFormAcik] = useState(false);
  const [form, setForm] = useState(BOS_FORM);
  const [hata, setHata] = useState('');
  const [bilgi, setBilgi] = useState('');

  const takim = (id: string) => veri.takimlar.find((t) => t.id === id);

  const durumRozeti = (durum: string) => {
    if (durum === 'open') return <Rozet ton="yesil">Başvurulara açık</Rozet>;
    if (durum === 'closed') return <Rozet>Kapandı</Rozet>;
    return <Rozet ton="uyari">Taslak</Rozet>;
  };

  const kaydet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.organizer.trim() || !form.startDate || !form.pitch.trim()) {
      setHata('Ad, organizatör, başlangıç tarihi ve saha alanları zorunludur.');
      return;
    }
    veri.turnuvaEkle({
      name: form.name.trim(),
      organizer: form.organizer.trim(),
      format: form.format,
      quota: Number(form.quota) || 0,
      fee: Number(form.fee) || 0,
      prize: form.prize.trim(),
      startDate: form.startDate,
      pitch: form.pitch.trim(),
      district: form.district,
    });
    setForm(BOS_FORM);
    setHata('');
    setFormAcik(false);
    setBilgi('Turnuva taslak olarak oluşturuldu.');
  };

  return (
    <>
      <div className="sayfa-basi">
        <div>
          <h1>Turnuvalar</h1>
          <p>Turnuvaları yönetin, takım başvurularını sonuçlandırın.</p>
        </div>
        <button type="button" className="btn btn-ana" onClick={() => setFormAcik((a) => !a)}>
          {formAcik ? 'Formu kapat' : 'Yeni turnuva'}
        </button>
      </div>

      <Rehber baslik="Nasıl çalışılır">
        Her turnuvanın altında başvuran takımlar listelenir. Kontenjan, onaylanan başvuru
        sayısına göre dolar. Yeni turnuva <strong>taslak</strong> olarak oluşturulur;
        başvurulara açılmadan önce bilgileri gözden geçirin.
      </Rehber>

      {bilgi && (
        <div className="kutu yesil" style={{ marginBottom: 20 }}>
          {bilgi}
        </div>
      )}

      {formAcik && (
        <section className="kart" style={{ marginBottom: 20 }}>
          <div className="kart-basi">
            <h2>Yeni turnuva</h2>
          </div>
          <form className="kart-govde" onSubmit={kaydet}>
            <div className="uc-sutun" style={{ marginBottom: 16 }}>
              <div className="alan">
                <label htmlFor="t-ad">Turnuva adı</label>
                <input id="t-ad" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="alan">
                <label htmlFor="t-org">Organizatör</label>
                <input id="t-org" type="text" value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} />
              </div>
              <div className="alan">
                <label htmlFor="t-format">Format</label>
                <select id="t-format" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value as Format })}>
                  <option value="7v7">7v7</option>
                  <option value="8v8">8v8</option>
                </select>
              </div>
              <div className="alan">
                <label htmlFor="t-kont">Kontenjan</label>
                <input id="t-kont" type="number" min={2} max={64} value={form.quota} onChange={(e) => setForm({ ...form, quota: Number(e.target.value) })} />
              </div>
              <div className="alan">
                <label htmlFor="t-ucret">Katılım ücreti (₺)</label>
                <input id="t-ucret" type="number" min={0} step={100} value={form.fee} onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })} />
              </div>
              <div className="alan">
                <label htmlFor="t-odul">Ödül</label>
                <input id="t-odul" type="text" value={form.prize} onChange={(e) => setForm({ ...form, prize: e.target.value })} placeholder="Kupa + 20.000 ₺" />
              </div>
              <div className="alan">
                <label htmlFor="t-tarih">Başlangıç tarihi</label>
                <input id="t-tarih" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="alan">
                <label htmlFor="t-saha">Saha</label>
                <input id="t-saha" type="text" value={form.pitch} onChange={(e) => setForm({ ...form, pitch: e.target.value })} />
              </div>
              <div className="alan">
                <label htmlFor="t-ilce">İlçe</label>
                <select id="t-ilce" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
                  {ILCELER.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hata && <p className="ipucu" style={{ color: 'var(--danger)', marginBottom: 12 }}>{hata}</p>}

            <div className="btn-sira">
              <button type="submit" className="btn btn-ana">
                Taslak olarak kaydet
              </button>
              <button type="button" className="btn btn-sessiz" onClick={() => { setFormAcik(false); setHata(''); }}>
                Vazgeç
              </button>
            </div>
          </form>
        </section>
      )}

      <div style={{ display: 'grid', gap: 20 }}>
        {veri.turnuvalar.map((t) => {
          const basvurular = veri.basvurular.filter((b) => b.tournamentId === t.id);
          const onayli = basvurular.filter((b) => b.status === 'accepted').length;
          const bekleyen = basvurular.filter((b) => b.status === 'pending').length;

          return (
            <section className="kart" key={t.id}>
              <div className="kart-basi">
                <div>
                  <h2>{t.name}</h2>
                  <div className="sonuk" style={{ fontSize: 12.5, marginTop: 2 }}>
                    {t.organizer} · {t.pitch} · {t.district}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {bekleyen > 0 && <Rozet ton="uyari">{bekleyen} bekleyen başvuru</Rozet>}
                  {durumRozeti(t.status)}
                </div>
              </div>

              <div className="kart-govde" style={{ borderBottom: '1px solid var(--line)' }}>
                <div className="uc-sutun">
                  <Bilgi baslik="Başlangıç" deger={t.startDate} />
                  <Bilgi baslik="Format" deger={t.format} />
                  <Bilgi baslik="Kontenjan" deger={`${onayli} / ${t.quota}`} />
                  <Bilgi baslik="Katılım ücreti" deger={t.fee > 0 ? para(t.fee) : 'Ücretsiz'} />
                  <Bilgi baslik="Ödül" deger={t.prize || '—'} />
                  <Bilgi baslik="Oluşturma" deger={tarih(t.createdAt)} />
                </div>
              </div>

              <div className="tablo-sarmal">
                <table className="tablo">
                  <thead>
                    <tr>
                      <th>Başvuran takım</th>
                      <th>Not</th>
                      <th>Başvuru tarihi</th>
                      <th>Durum</th>
                      <th className="sag">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {basvurular.length === 0 && (
                      <BosHal
                        baslik="Başvuru yok"
                        aciklama="Takımlar uygulamadan başvurduğunda buraya düşer."
                        sutun={5}
                      />
                    )}
                    {basvurular.map((b) => {
                      const bt = takim(b.teamId);
                      return (
                        <tr key={b.id}>
                          <td>
                            <span className="takim-hucre">
                              <Arma takim={bt} boyut={28} />
                              <span>
                                <strong>{bt?.name ?? '—'}</strong>
                                <div className="silik" style={{ fontSize: 12 }}>{bt?.district} · {bt?.level}</div>
                              </span>
                            </span>
                          </td>
                          <td>{b.note || <span className="silik">—</span>}</td>
                          <td>{tarih(b.createdAt)}</td>
                          <td>
                            {b.status === 'pending' ? (
                              <Rozet ton="uyari">Bekliyor</Rozet>
                            ) : b.status === 'accepted' ? (
                              <Rozet ton="yesil">Onaylandı</Rozet>
                            ) : (
                              <Rozet ton="kirmizi">Reddedildi</Rozet>
                            )}
                          </td>
                          <td className="sag">
                            {b.status === 'pending' ? (
                              <div className="btn-sira" style={{ justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  className="btn btn-ana btn-kucuk"
                                  onClick={() =>
                                    setOnay({
                                      baslik: 'Başvuru onaylansın mı?',
                                      aciklama: `${bt?.name ?? 'Takım'} turnuvaya kabul edilecek.`,
                                      onayMetni: 'Onayla',
                                      sonuclar: [
                                        'Takım turnuva kadrosuna eklenir.',
                                        'Kontenjandan bir yer düşer.',
                                        'Takıma bildirim gider.',
                                      ],
                                      notEtiketi: 'Not',
                                      uygula: (not) => veri.basvuruKarari(b.id, 'accepted', not),
                                    })
                                  }
                                >
                                  Onayla
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-cizgi btn-kucuk"
                                  onClick={() =>
                                    setOnay({
                                      baslik: 'Başvuru reddedilsin mi?',
                                      aciklama: `${bt?.name ?? 'Takım'} turnuvaya alınmayacak.`,
                                      onayMetni: 'Reddet',
                                      tehlikeli: true,
                                      sonuclar: [
                                        'Takım turnuvaya alınmaz.',
                                        'Gerekçe takıma iletilir.',
                                      ],
                                      notEtiketi: 'Ret gerekçesi',
                                      notZorunlu: true,
                                      notOnerileri: ['Kontenjan doldu.', 'Seviye uygun değil.', 'Eksik bilgi.'],
                                      uygula: (not) => veri.basvuruKarari(b.id, 'rejected', not),
                                    })
                                  }
                                >
                                  Reddet
                                </button>
                              </div>
                            ) : (
                              <span className="silik">sonuçlandı</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>

      <OnayDiyalogu istek={onay} kapat={() => setOnay(null)} />
    </>
  );
}

function Bilgi({ baslik, deger }: { baslik: string; deger: string }) {
  return (
    <div>
      <div className="mikro silik">{baslik}</div>
      <div style={{ fontWeight: 700, marginTop: 2 }}>{deger}</div>
    </div>
  );
}
