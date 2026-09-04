'use client';

import Link from 'next/link';
import { useVeri } from '@/lib/durum';
import { bugunMu, gecenSure, sonGunlerde } from '@/lib/bicim';
import {
  Arma,
  HataKutusu,
  Rehber,
  Rozet,
  SayiKart,
  Yukleniyor,
  hedefMetni,
  sebepMetni,
} from '@/components/parcalar';

export default function OzetSayfasi() {
  const veri = useVeri();

  const acikSikayetler = veri.sikayetler.filter((r) => r.status === 'open');
  const acikGelmeme = veri.degerlendirmeler.filter((d) => d.no_show);
  const bugunkuIlanlar = veri.ilanlar.filter((i) => bugunMu(i.created_at));
  const haftalikMac = veri.maclar.filter((m) => m.status !== 'cancelled' && sonGunlerde(m.created_at, 7));

  const takim = (id: string | null) => veri.takimlar.find((t) => t.id === id);
  const kisi = (id: string | null) => veri.profiller.find((p) => p.id === id);

  /** Aynı hedef hakkında birden fazla şikayet varsa önce o ele alınmalı. */
  const tekrar = (tur: string, id: string) =>
    veri.sikayetler.filter((r) => r.target_type === tur && r.target_id === id).length;

  const hedefAdi = (tur: string, id: string) => {
    if (tur === 'team') return takim(id)?.name ?? 'Silinmiş takım';
    if (tur === 'profile') return kisi(id)?.name || kisi(id)?.email || 'Silinmiş kullanıcı';
    if (tur === 'listing') {
      const ilan = veri.ilanlar.find((i) => i.id === id);
      return ilan ? `${ilan.pitch} · ${ilan.date_text}` : 'Kaldırılmış ilan';
    }
    return id.slice(0, 8);
  };

  const oncelikliSikayetler = [...acikSikayetler]
    .sort(
      (a, b) =>
        tekrar(b.target_type, b.target_id) - tekrar(a.target_type, a.target_id) ||
        Date.parse(b.created_at) - Date.parse(a.created_at),
    )
    .slice(0, 6);

  const sonKayitlar = veri.kayitlar.slice(0, 8);
  const bekleyenIs = acikSikayetler.length + acikGelmeme.length;

  // Gelmeme bildirimi olan ya da sonucu çekişmeli maçlar.
  const sorunluMac = veri.maclar.filter(
    (m) =>
      m.result_status === 'disputed' ||
      veri.degerlendirmeler.some((d) => d.match_id === m.id && d.no_show),
  ).length;

  if (veri.yukleniyor && veri.profiller.length === 0) {
    return <Yukleniyor />;
  }

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

      {veri.hata && <HataKutusu hata={veri.hata} yenile={() => void veri.yenile()} />}

      <Rehber baslik={bekleyenIs > 0 ? `Bekleyen ${bekleyenIs} iş var` : 'Kuyruk temiz'}>
        {bekleyenIs > 0 ? (
          <>
            Önce <strong>şikayetleri</strong> sonuçlandırın, ardından{' '}
            <strong>gelmeme bildirimlerini</strong> değerlendirin. Aynı hedef hakkında birden fazla
            kayıt varsa listede üstte görünür.
          </>
        ) : (
          <>Sonuçlandırılmayı bekleyen şikayet ya da bildirim yok.</>
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
          baslik="Gelmeme bildirimi"
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
        <SayiKart baslik="Haftalık eşleşen maç" deger={haftalikMac.length} alt="Son 7 günde kesinleşti" />
        <SayiKart
          baslik="Sorunlu maç"
          deger={sorunluMac}
          alt="Gelmeme bildirimi ya da çekişmeli sonuç"
          ton={sorunluMac > 0 ? 'vurgu' : 'iyi'}
          git="/maclar"
          gitMetni="Maçları aç"
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
            {oncelikliSikayetler.length === 0 && (
              <div className="bos-hal">
                <div className="simge" aria-hidden="true">✓</div>
                <strong>Bekleyen şikayet yok</strong>
                <p>Yeni bir bildirim geldiğinde burada görünür.</p>
              </div>
            )}
            {oncelikliSikayetler.map((r) => {
              const adet = tekrar(r.target_type, r.target_id);
              return (
                <div className="mini-oge" key={r.id}>
                  {r.target_type === 'team' && <Arma takim={takim(r.target_id)} boyut={34} />}
                  <div className="govde">
                    <strong>
                      {sebepMetni(r.reason)} · {hedefAdi(r.target_type, r.target_id)}
                    </strong>
                    <p>{r.detail}</p>
                    <p className="silik" style={{ fontSize: 12, marginTop: 4 }}>
                      {hedefMetni(r.target_type)} · Bildiren:{' '}
                      {kisi(r.reporter_id)?.name || 'Bilinmeyen'}
                    </p>
                  </div>
                  <div style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
                    {adet > 1 ? <Rozet ton="kirmizi">{adet}. şikayet</Rozet> : <Rozet ton="uyari">Açık</Rozet>}
                    <time>{gecenSure(r.created_at)}</time>
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
            {sonKayitlar.length === 0 && (
              <div className="bos-hal">
                <div className="simge" aria-hidden="true">—</div>
                <strong>Henüz işlem yok</strong>
                <p>Yaptığınız ilk yaptırım burada görünecek.</p>
              </div>
            )}
            {sonKayitlar.map((k) => (
              <div className="mini-oge" key={k.id}>
                <div className="govde">
                  <strong>{k.action}</strong>
                  <p>
                    {kisi(k.admin_id)?.name || 'Yönetici'}
                    {k.note ? ` · ${k.note}` : ''}
                  </p>
                </div>
                <time>{gecenSure(k.created_at)}</time>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
