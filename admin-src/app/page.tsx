'use client';

import Link from 'next/link';
import { useVeri } from '@/lib/durum';
import { bugunMu, gecenSure } from '@/lib/bicim';
import { BUGUN, GUN } from '@/lib/mock/sabitler';
import { Arma, HEDEF_METNI, Rehber, Rozet, SEBEP_METNI, SayiKart } from '@/components/parcalar';

export default function OzetSayfasi() {
  const veri = useVeri();

  const acikSikayetler = veri.sikayetler.filter((r) => r.status === 'open');
  const acikGelmeme = veri.maclar.filter((m) => m.noShow);
  const bugunkuIlanlar = veri.ilanlar.filter((i) => bugunMu(i.createdAt));
  const haftalikMac = veri.maclar.filter(
    (m) => m.status !== 'cancelled' && m.createdAt >= BUGUN - 7 * GUN,
  );

  /** Aynı hedef hakkında birden fazla açık şikayet varsa önce o ele alınmalı. */
  const tekrarSayisi = (tur: string, id: string) =>
    veri.sikayetler.filter((r) => r.targetType === tur && r.targetId === id).length;

  const sonSikayetler = [...acikSikayetler]
    .sort(
      (a, b) =>
        tekrarSayisi(b.targetType, b.targetId) - tekrarSayisi(a.targetType, a.targetId) ||
        b.createdAt - a.createdAt,
    )
    .slice(0, 6);

  const sonKayitlar = [...veri.kayitlar].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);

  const kisiAdi = (id: string) => veri.profiller.find((p) => p.id === id)?.name ?? 'Silinmiş kullanıcı';
  const takim = (id: string) => veri.takimlar.find((t) => t.id === id);
  const hedefAdi = (tur: string, id: string) => {
    if (tur === 'team') return takim(id)?.name ?? id;
    if (tur === 'profile') return veri.profiller.find((p) => p.id === id)?.name ?? id;
    if (tur === 'listing') {
      const ilan = veri.ilanlar.find((i) => i.id === id);
      return ilan ? `${ilan.pitch} · ${ilan.date}` : 'Kaldırılmış ilan';
    }
    return id;
  };

  const bekleyenBasvuru = veri.basvurular.filter((b) => b.status === 'pending').length;
  const isVar = acikSikayetler.length + acikGelmeme.length + bekleyenBasvuru;

  return (
    <>
      <div className="sayfa-basi">
        <div>
          <h1>Özet</h1>
          <p>Bugün sizi bekleyen işler ve son hareketler.</p>
        </div>
        <div className="btn-sira">
          <Link className="btn btn-ana" href="/sikayetler">
            Şikayet kuyruğuna git
          </Link>
        </div>
      </div>

      <Rehber baslik={isVar > 0 ? `Bekleyen ${isVar} iş var` : 'Kuyruk temiz'}>
        {isVar > 0 ? (
          <>
            Önce <strong>şikayetleri</strong> sonuçlandırın, ardından{' '}
            <strong>gelmeme bildirimlerini</strong> değerlendirin. Aynı takım hakkında birden fazla
            kayıt varsa listede üstte görünür.
          </>
        ) : (
          <>Sonuçlandırılmayı bekleyen şikayet, bildirim veya başvuru yok.</>
        )}
      </Rehber>

      <div className="sayilar">
        <SayiKart
          baslik="Bekleyen şikayet"
          deger={acikSikayetler.length}
          alt={acikSikayetler.length > 0 ? 'Sonuçlandırılmayı bekliyor' : 'Kuyruk temiz'}
          ton={acikSikayetler.length > 0 ? 'vurgu' : 'iyi'}
          git="/sikayetler"
          gitMetni="Kuyruğu aç"
        />
        <SayiKart
          baslik="Açık gelmeme bildirimi"
          deger={acikGelmeme.length}
          alt="Sahaya gelmediği bildirilen maçlar"
          ton={acikGelmeme.length > 0 ? 'vurgu' : 'iyi'}
          git="/gelmeyenler"
          gitMetni="Bildirimleri aç"
        />
        <SayiKart
          baslik="Bugünkü yeni ilan"
          deger={bugunkuIlanlar.length}
          alt="Son 24 saatte yayınlandı"
          git="/ilanlar"
          gitMetni="İlanları aç"
        />
        <SayiKart
          baslik="Haftalık eşleşen maç"
          deger={haftalikMac.length}
          alt="Son 7 günde kesinleşti"
        />
      </div>

      <div className="ikili">
        <section className="kart">
          <div className="kart-basi">
            <h2>Öncelikli şikayetler</h2>
            <Link className="etiket" href="/sikayetler">
              Tümünü gör
            </Link>
          </div>
          <div className="bolum-not">
            Birden fazla şikayet almış hedefler en üstte. Ayrıntı için şikayet ekranında satıra tıklayın.
          </div>
          <div className="mini-liste">
            {sonSikayetler.length === 0 && (
              <div className="bos-hal">
                <div className="simge" aria-hidden="true">✓</div>
                <strong>Bekleyen şikayet yok</strong>
                <p>Yeni bir bildirim geldiğinde burada görünür.</p>
              </div>
            )}
            {sonSikayetler.map((r) => {
              const tekrar = tekrarSayisi(r.targetType, r.targetId);
              return (
                <div className="mini-oge" key={r.id}>
                  {r.targetType === 'team' && <Arma takim={takim(r.targetId)} boyut={34} />}
                  <div className="govde">
                    <strong>
                      {SEBEP_METNI[r.reason]} · {hedefAdi(r.targetType, r.targetId)}
                    </strong>
                    <p>{r.detail}</p>
                    <p className="silik" style={{ fontSize: 12, marginTop: 4 }}>
                      {HEDEF_METNI[r.targetType]} · Bildiren: {kisiAdi(r.reporterId)}
                    </p>
                  </div>
                  <div style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
                    {tekrar > 1 ? <Rozet ton="kirmizi">{tekrar}. şikayet</Rozet> : <Rozet ton="uyari">Açık</Rozet>}
                    <time>{gecenSure(r.createdAt)}</time>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="kart">
          <div className="kart-basi">
            <h2>Son işlemler</h2>
            <Link className="etiket" href="/kayitlar">
              İşlem kaydı
            </Link>
          </div>
          <div className="bolum-not">Panelde yapılan her işlem kalıcı olarak kaydedilir.</div>
          <div className="mini-liste">
            {sonKayitlar.map((k) => (
              <div className="mini-oge" key={k.id}>
                <div className="govde">
                  <strong>{k.action}</strong>
                  <p>
                    {k.adminName}
                    {k.note ? ` · ${k.note}` : ''}
                  </p>
                </div>
                <time>{gecenSure(k.createdAt)}</time>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
