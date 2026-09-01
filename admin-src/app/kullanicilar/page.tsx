'use client';

import { useMemo, useState } from 'react';
import { gelmemeSayisi, oynananMaclar, ortalamaPuan, useVeri } from '@/lib/durum';
import { icerir, tarih, tarihSaat } from '@/lib/bicim';
import { OnayDiyalogu, type OnayIstegi } from '@/components/OnayDiyalogu';
import { Satir, YanPanel } from '@/components/YanPanel';
import {
  Arma,
  BosHal,
  Eylem,
  HataKutusu,
  IlanTuruRozeti,
  Rehber,
  Rozet,
  SikayetRozeti,
  Yukleniyor,
  sebepMetni,
} from '@/components/parcalar';

type Secim = { tur: 'profil' | 'takim'; id: string } | null;

export default function KullanicilarSayfasi() {
  const veri = useVeri();
  const [sekme, setSekme] = useState<'kullanicilar' | 'takimlar'>('kullanicilar');
  const [arama, setArama] = useState('');
  const [durum, setDurum] = useState<'hepsi' | 'active' | 'suspended'>('hepsi');
  const [secim, setSecim] = useState<Secim>(null);
  const [onay, setOnay] = useState<OnayIstegi | null>(null);

  const takim = (id: string | null) => veri.takimlar.find((t) => t.id === id);
  const profil = (id: string) => veri.profiller.find((p) => p.id === id);

  /** Bir kullanıcının takımı team_members üzerinden bulunur. */
  const kullanicininTakimi = (profilId: string) => {
    const uye = veri.uyeler.find((u) => u.profile_id === profilId && u.status === 'joined');
    return uye ? takim(uye.team_id) : undefined;
  };

  const kullanicilar = useMemo(
    () =>
      veri.profiller
        .filter((p) => (durum === 'hepsi' ? true : p.status === durum))
        .filter((p) => icerir(p.name, arama) || icerir(p.email, arama)),
    [veri.profiller, durum, arama],
  );

  const takimlar = useMemo(
    () =>
      veri.takimlar
        .filter((t) => icerir(t.name, arama) || icerir(t.district, arama) || icerir(t.code, arama))
        .map((t) => ({
          takim: t,
          uye: veri.uyeler.filter((u) => u.team_id === t.id && u.status === 'joined').length,
          oynanan: oynananMaclar(veri, t.id).length,
          ortalama: ortalamaPuan(veri, t.id),
          gelmeme: gelmemeSayisi(veri, t.id),
          sikayet: veri.sikayetler.filter((r) => r.target_type === 'team' && r.target_id === t.id).length,
        }))
        .sort((a, b) => b.gelmeme - a.gelmeme || b.oynanan - a.oynanan),
    [veri, arama],
  );

  const seciliProfil = secim?.tur === 'profil' ? profil(secim.id) : undefined;
  const seciliTakim = secim?.tur === 'takim' ? takim(secim.id) : undefined;

  if (veri.yukleniyor && veri.profiller.length === 0) return <Yukleniyor />;

  return (
    <>
      <div className="sayfa-basi">
        <div>
          <h1>Kullanıcılar ve takımlar</h1>
          <p>Hesapları ve takım kayıtlarını görüntüleyin, gerektiğinde kısıtlayın.</p>
        </div>
      </div>

      {veri.hata && <HataKutusu hata={veri.hata} yenile={() => void veri.yenile()} />}

      <Rehber baslik="Nasıl çalışılır">
        Satıra tıklayınca sağda ayrıntı paneli açılır: o kaydın ilanları, maçları, aldığı şikayetler
        ve hakkında yapılmış işlemler orada bir arada görünür. Takım tablosundaki kırmızı rozetler
        yaptırım gerekebilecek takımları işaret eder.
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
              placeholder={sekme === 'kullanicilar' ? 'Ad ya da e-posta' : 'Takım adı, ilçe ya da kod'}
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
            ? 'Yönetici hesapları askıya alınamaz. Hesap silme panelden yapılamaz — kullanıcı bunu uygulamadan kendisi yapar.'
            : 'Ortalama puan yalnızca oynanmış ve onaylanmış maçlardan hesaplanır.'}
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
                  <th className="sag">Ayrıntı</th>
                </tr>
              </thead>
              <tbody>
                {kullanicilar.length === 0 && (
                  <BosHal baslik="Kullanıcı bulunamadı" aciklama="Arama ya da durum filtresini değiştirip tekrar deneyin." />
                )}
                {kullanicilar.map((p) => (
                  <tr
                    key={p.id}
                    className={`tiklanir${secim?.tur === 'profil' && secim.id === p.id ? ' secili' : ''}`}
                    onClick={() => setSecim({ tur: 'profil', id: p.id })}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSecim({ tur: 'profil', id: p.id });
                      }
                    }}
                  >
                    <td>
                      <strong>{p.name || '(isimsiz)'}</strong>
                      {p.role === 'admin' && (
                        <div style={{ marginTop: 4 }}><Rozet ton="dolu">Yönetici</Rozet></div>
                      )}
                    </td>
                    <td>{p.email ?? <span className="silik">—</span>}</td>
                    <td>{kullanicininTakimi(p.id)?.name ?? <span className="silik">Takımsız</span>}</td>
                    <td>
                      {p.status === 'active' ? (
                        <Rozet ton="yesil">Etkin</Rozet>
                      ) : (
                        <>
                          <Rozet ton="kirmizi">Askıda</Rozet>
                          {p.suspended_reason && (
                            <div className="silik" style={{ fontSize: 12, marginTop: 4 }}>{p.suspended_reason}</div>
                          )}
                        </>
                      )}
                    </td>
                    <td>{tarih(p.created_at)}</td>
                    <td className="sag"><span className="satir-ok" aria-hidden="true">Aç →</span></td>
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
                  <th>Oynanan</th>
                  <th>Puan</th>
                  <th className="sag">Uyarı işaretleri</th>
                </tr>
              </thead>
              <tbody>
                {takimlar.length === 0 && (
                  <BosHal baslik="Takım bulunamadı" aciklama="Aramayı sadeleştirip tekrar deneyin." />
                )}
                {takimlar.map((s) => (
                  <tr
                    key={s.takim.id}
                    className={`tiklanir${secim?.tur === 'takim' && secim.id === s.takim.id ? ' secili' : ''}`}
                    onClick={() => setSecim({ tur: 'takim', id: s.takim.id })}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSecim({ tur: 'takim', id: s.takim.id });
                      }
                    }}
                  >
                    <td>
                      <span className="takim-hucre">
                        <Arma takim={s.takim} />
                        <span>
                          <strong>{s.takim.name}</strong>
                          <div className="silik" style={{ fontSize: 12 }}>{s.takim.code} · {s.takim.format}</div>
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

      {/* --- Kullanıcı ayrıntısı --- */}
      <YanPanel
        acik={Boolean(seciliProfil)}
        kapat={() => setSecim(null)}
        baslik={seciliProfil?.name || '(isimsiz kullanıcı)'}
        altBaslik={seciliProfil?.email ?? undefined}
        alt={
          seciliProfil && (
            <div className="eylem-liste">
              {seciliProfil.status === 'active' ? (
                <Eylem
                  ad="Hesabı askıya al"
                  ne={
                    seciliProfil.role === 'admin'
                      ? 'Yönetici hesapları askıya alınamaz.'
                      : 'Hesabın durumu "askıda" olur.'
                  }
                  tehlikeli
                  kapali={seciliProfil.role === 'admin'}
                  tikla={() =>
                    setOnay({
                      baslik: 'Hesap askıya alınsın mı?',
                      aciklama: `${seciliProfil.name || seciliProfil.email} hesabı askıya alınacak.`,
                      onayMetni: 'Askıya al',
                      tehlikeli: true,
                      sonuclar: [
                        'Hesabın durumu "askıda" olur.',
                        'Askı istendiği an kaldırılabilir.',
                        'Gerekçe işlem kaydına yazılır.',
                      ],
                      notEtiketi: 'Askıya alma gerekçesi',
                      notZorunlu: true,
                      notOnerileri: ['Tekrarlanan sahte ilan', 'Hakaret', 'Taciz', 'Spam'],
                      uygula: async (not) => {
                        await veri.kullaniciAskiyaAl(seciliProfil.id, not);
                      },
                    })
                  }
                />
              ) : (
                <Eylem
                  ad="Askıyı kaldır"
                  ne="Hesap yeniden etkin olur."
                  tikla={() =>
                    setOnay({
                      baslik: 'Askı kaldırılsın mı?',
                      aciklama: `${seciliProfil.name || seciliProfil.email} yeniden işlem yapabilecek.`,
                      onayMetni: 'Askıyı kaldır',
                      sonuclar: ['Hesap "etkin" olur.', 'Askı gerekçesi temizlenir.'],
                      notEtiketi: 'Not',
                      uygula: async () => {
                        await veri.kullaniciAskisiniKaldir(seciliProfil.id);
                      },
                    })
                  }
                />
              )}

              {seciliProfil.role === 'user' ? (
                <Eylem
                  ad="Yönetici yap"
                  ne="Bu hesap yönetim paneline girebilir."
                  tehlikeli
                  tikla={() =>
                    setOnay({
                      baslik: 'Yönetici yetkisi verilsin mi?',
                      aciklama: `${seciliProfil.name || seciliProfil.email} yönetim paneline erişebilecek.`,
                      onayMetni: 'Yönetici yap',
                      tehlikeli: true,
                      sonuclar: [
                        'Hesap tüm verileri görebilir ve yaptırım uygulayabilir.',
                        'Yetki istendiği an geri alınabilir.',
                      ],
                      notEtiketi: 'Gerekçe',
                      notZorunlu: true,
                      uygula: async () => {
                        await veri.rolDegistir(seciliProfil.id, 'admin');
                      },
                    })
                  }
                />
              ) : (
                <Eylem
                  ad="Yönetici yetkisini al"
                  ne={
                    seciliProfil.id === veri.yonetici?.id
                      ? 'Kendi yetkinizi alamazsınız.'
                      : 'Hesap normal kullanıcıya döner.'
                  }
                  tehlikeli
                  kapali={seciliProfil.id === veri.yonetici?.id}
                  tikla={() =>
                    setOnay({
                      baslik: 'Yönetici yetkisi alınsın mı?',
                      aciklama: `${seciliProfil.name || seciliProfil.email} artık panele giremeyecek.`,
                      onayMetni: 'Yetkiyi al',
                      tehlikeli: true,
                      sonuclar: ['Hesap normal kullanıcıya döner.', 'Panel erişimi sona erer.'],
                      notEtiketi: 'Gerekçe',
                      notZorunlu: true,
                      uygula: async () => {
                        await veri.rolDegistir(seciliProfil.id, 'user');
                      },
                    })
                  }
                />
              )}
            </div>
          )
        }
      >
        {seciliProfil && (
          <KullaniciDetayi
            profilId={seciliProfil.id}
            takimAdi={kullanicininTakimi(seciliProfil.id)?.name}
          />
        )}
      </YanPanel>

      {/* --- Takım ayrıntısı --- */}
      <YanPanel
        acik={Boolean(seciliTakim)}
        kapat={() => setSecim(null)}
        baslik={seciliTakim?.name ?? ''}
        altBaslik={seciliTakim ? `${seciliTakim.district} · ${seciliTakim.level} · ${seciliTakim.code}` : undefined}
        alt={
          seciliTakim && (
            <div className="eylem-liste">
              <Eylem
                ad="İlan kısıtı kaydet"
                ne="Kayda geçer; kısıtlama için şema desteği yok."
                tehlikeli
                tikla={() =>
                  setOnay({
                    baslik: 'İlan kısıtı kaydedilsin mi?',
                    aciklama: `${seciliTakim.name} için kısıtlama kararı işlem kaydına yazılacak.`,
                    onayMetni: 'Kaydet',
                    tehlikeli: true,
                    sonuclar: [
                      'Karar işlem kaydına yazılır.',
                      'Takımın ilan vermesi teknik olarak ENGELLENMEZ.',
                    ],
                    notEtiketi: 'Gerekçe ve süre',
                    notZorunlu: true,
                    notOnerileri: ['İki hafta süreyle', 'Bir ay süreyle'],
                    uygula: async (not) => {
                      await veri.ilanKisiti(seciliTakim.id, not);
                    },
                  })
                }
              />
            </div>
          )
        }
      >
        {seciliTakim && <TakimDetayi takimId={seciliTakim.id} />}
      </YanPanel>

      <OnayDiyalogu istek={onay} kapat={() => setOnay(null)} />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function KullaniciDetayi({ profilId, takimAdi }: { profilId: string; takimAdi?: string }) {
  const veri = useVeri();
  const p = veri.profiller.find((x) => x.id === profilId);
  if (!p) return null;

  const sikayetler = veri.sikayetler.filter((r) => r.target_type === 'profile' && r.target_id === p.id);
  const ilanlar = veri.ilanlar.filter((i) => i.author_id === p.id);
  const kayitlar = veri.kayitlar.filter((k) => k.target_id === p.id);

  return (
    <>
      {p.status === 'suspended' && (
        <div className="kutu kirmizi" style={{ marginBottom: 16 }}>
          <h4>Hesap askıda</h4>
          {p.suspended_reason ?? 'Gerekçe belirtilmemiş.'}
          {p.suspended_at ? ` · ${tarih(p.suspended_at)}` : ''}
        </div>
      )}

      <h4 style={{ marginBottom: 10 }}>Bilgiler</h4>
      <dl className="satir-liste">
        <Satir baslik="E-posta">{p.email ?? '—'}</Satir>
        <Satir baslik="Takımı">{takimAdi ?? 'Takımsız'}</Satir>
        <Satir baslik="Rol">{p.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}</Satir>
        <Satir baslik="Durum">
          {p.status === 'active' ? <Rozet ton="yesil">Etkin</Rozet> : <Rozet ton="kirmizi">Askıda</Rozet>}
        </Satir>
        <Satir baslik="Kayıt">{tarihSaat(p.created_at)}</Satir>
        <Satir baslik="Kimlik">{p.id.slice(0, 8)}</Satir>
      </dl>

      <h4 style={{ margin: '22px 0 10px' }}>Aldığı şikayetler ({sikayetler.length})</h4>
      <div className="kutu">
        {sikayetler.length === 0 ? 'Hakkında şikayet yok.' : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {sikayetler.map((r) => (
              <li key={r.id} style={{ marginBottom: 4 }}>
                {tarih(r.created_at)} · {sebepMetni(r.reason)} · <SikayetRozeti durum={r.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <h4 style={{ margin: '22px 0 10px' }}>Açtığı ilanlar ({ilanlar.length})</h4>
      <div className="kutu">
        {ilanlar.length === 0 ? 'İlan yok.' : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {ilanlar.slice(0, 10).map((i) => (
              <li key={i.id} style={{ marginBottom: 4 }}>
                {i.date_text} · {i.pitch} · <IlanTuruRozeti tur={i.kind} />
                {!i.is_open && ' (kaldırılmış)'}
              </li>
            ))}
          </ul>
        )}
      </div>

      <h4 style={{ margin: '22px 0 10px' }}>Hakkındaki işlemler ({kayitlar.length})</h4>
      <div className="kutu">
        {kayitlar.length === 0 ? 'Kayıtlı işlem yok.' : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {kayitlar.map((k) => (
              <li key={k.id} style={{ marginBottom: 4 }}>
                {tarih(k.created_at)} · {k.action}
                {k.note ? ` · ${k.note}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function TakimDetayi({ takimId }: { takimId: string }) {
  const veri = useVeri();
  const t = veri.takimlar.find((x) => x.id === takimId);
  if (!t) return null;

  const uyeler = veri.uyeler.filter((u) => u.team_id === t.id && u.status === 'joined');
  const ilanlar = veri.ilanlar.filter((i) => i.team_id === t.id);
  const maclar = veri.maclar.filter((m) => m.home_team_id === t.id || m.away_team_id === t.id);
  const sikayetler = veri.sikayetler.filter((r) => r.target_type === 'team' && r.target_id === t.id);
  const gelmeme = gelmemeSayisi(veri, t.id);

  return (
    <>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
        <Arma takim={t} boyut={48} />
        <div>
          <div style={{ fontWeight: 700 }}>{t.name}</div>
          <div className="sonuk" style={{ fontSize: 12.5 }}>Katılım kodu: {t.code}</div>
        </div>
      </div>

      {gelmeme > 0 && (
        <div className="kutu kirmizi" style={{ marginBottom: 16 }}>
          <h4>{gelmeme} gelmeme bildirimi</h4>
          Bu takım sahaya gelmediği gerekçesiyle bildirilmiş.
        </div>
      )}

      <h4 style={{ marginBottom: 10 }}>Bilgiler</h4>
      <dl className="satir-liste">
        <Satir baslik="İlçe">{t.district}</Satir>
        <Satir baslik="Seviye">{t.level}</Satir>
        <Satir baslik="Format">{t.format}</Satir>
        <Satir baslik="Diziliş">{t.formation_id}</Satir>
        <Satir baslik="Üye">{uyeler.length}</Satir>
        <Satir baslik="Oynanan maç">{oynananMaclar(veri, t.id).length}</Satir>
        <Satir baslik="Ortalama puan">{ortalamaPuan(veri, t.id)}</Satir>
        <Satir baslik="Kuruluş">{tarih(t.created_at)}</Satir>
      </dl>

      <h4 style={{ margin: '22px 0 10px' }}>Üyeler ({uyeler.length})</h4>
      <div className="kutu">
        {uyeler.length === 0 ? 'Üye yok.' : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {uyeler.map((u) => {
              const p = veri.profiller.find((x) => x.id === u.profile_id);
              return (
                <li key={u.profile_id} style={{ marginBottom: 4 }}>
                  {p?.name || p?.email || u.profile_id.slice(0, 8)} · {u.role}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <h4 style={{ margin: '22px 0 10px' }}>Son maçlar ({maclar.length})</h4>
      <div className="kutu">
        {maclar.length === 0 ? 'Maç kaydı yok.' : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {maclar.slice(0, 8).map((m) => {
              const rakipId = m.home_team_id === t.id ? m.away_team_id : m.home_team_id;
              const rakip = veri.takimlar.find((x) => x.id === rakipId);
              const skor =
                m.home_score !== null && m.away_score !== null ? `${m.home_score} - ${m.away_score}` : '—';
              return (
                <li key={m.id} style={{ marginBottom: 4 }}>
                  {m.date_text} · {rakip?.name ?? 'Bilinmeyen'} · {skor} · {m.status}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <h4 style={{ margin: '22px 0 10px' }}>İlanlar ({ilanlar.length})</h4>
      <div className="kutu">
        {ilanlar.length === 0 ? 'İlan yok.' : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {ilanlar.slice(0, 8).map((i) => (
              <li key={i.id} style={{ marginBottom: 4 }}>
                {i.date_text} · {i.pitch}
                {!i.is_open && ' (kaldırılmış)'}
              </li>
            ))}
          </ul>
        )}
      </div>

      <h4 style={{ margin: '22px 0 10px' }}>Aldığı şikayetler ({sikayetler.length})</h4>
      <div className="kutu">
        {sikayetler.length === 0 ? 'Hakkında şikayet yok.' : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {sikayetler.map((r) => (
              <li key={r.id} style={{ marginBottom: 4 }}>
                {tarih(r.created_at)} · {sebepMetni(r.reason)} · <SikayetRozeti durum={r.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
