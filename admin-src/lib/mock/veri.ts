/**
 * Sahte veri kümesi — tek kaynak.
 *
 * Hiçbir kayıt gerçek değildir, hiçbir sunucuya bağlanmaz. Alan adları
 * lib/tipler.ts ile birebir aynıdır; sunucu geldiğinde bu dosyanın yerine
 * gerçek sorgular konulacak, ekranlar değişmeyecek.
 */

import type {
  Announcement,
  AuditLog,
  Listing,
  ListingKind,
  Match,
  Offer,
  Profile,
  Report,
  Team,
  Tournament,
  TournamentApplication,
} from '../tipler';
import {
  ADLAR,
  BUGUN,
  GUN,
  RENKLER,
  SAATLER,
  SAHALAR,
  sayi,
  sec,
  uretec,
} from './sabitler';

/* -------------------------------------------------------------------------- */
/* Takımlar                                                                   */
/* -------------------------------------------------------------------------- */

export const takimlar: Team[] = [
  { id: 't1', name: 'Aslanbey SK', short: 'ASK', district: 'Onikişubat', level: 'İddialı', color: RENKLER[0], code: 'ASK-4X7K', format: '7v7', formationId: '7-231' },
  { id: 't2', name: 'Dulkadir United', short: 'DU', district: 'Dulkadiroğlu', level: 'Orta', color: RENKLER[1], code: 'DU-9M2P', format: '8v8', formationId: '8-332' },
  { id: 't3', name: 'Kale Kartalları', short: 'KKL', district: 'Elbistan', level: 'İddialı', color: RENKLER[3], code: 'KKL-7T1B', format: '7v7', formationId: '7-222' },
  { id: 't4', name: 'Menzelet FK', short: 'MFK', district: 'Onikişubat', level: 'Amatör', color: RENKLER[4], code: 'MFK-2R6E', format: '7v7', formationId: '7-141' },
  { id: 't5', name: 'Ahır Dağı SK', short: 'ADS', district: 'Dulkadiroğlu', level: 'Orta', color: RENKLER[2], code: 'ADS-5C8J', format: '8v8', formationId: '8-341' },
  { id: 't6', name: 'Afşin Yıldızspor', short: 'AYS', district: 'Afşin', level: 'Orta', color: RENKLER[6], code: 'AYS-1K3D', format: '7v7', formationId: '7-321' },
  { id: 't7', name: 'Türkoğlu FK', short: 'TFK', district: 'Türkoğlu', level: 'Amatör', color: RENKLER[5], code: 'TFK-8W4N', format: '7v7', formationId: '7-231' },
  { id: 't8', name: 'Pazarcık Şimşek', short: 'PŞS', district: 'Pazarcık', level: 'Amatör', color: RENKLER[7], code: 'PSS-3H9L', format: '8v8', formationId: '8-323' },
  { id: 't9', name: 'Yörükselim Gücü', short: 'YRG', district: 'Onikişubat', level: 'İddialı', color: RENKLER[0], code: 'YRG-6V2A', format: '7v7', formationId: '7-312' },
  { id: 't10', name: 'Kapıçam Spor', short: 'KPS', district: 'Onikişubat', level: 'Orta', color: RENKLER[1], code: 'KPS-4B7Z', format: '7v7', formationId: '7-222' },
  { id: 't11', name: 'Sümer Gençlik', short: 'SMG', district: 'Dulkadiroğlu', level: 'Amatör', color: RENKLER[4], code: 'SMG-9F1X', format: '8v8', formationId: '8-242' },
  { id: 't12', name: 'Elbistan Arena SK', short: 'EAS', district: 'Elbistan', level: 'Profesyonel', color: RENKLER[3], code: 'EAS-2Q5M', format: '8v8', formationId: '8-431' },
];

/* -------------------------------------------------------------------------- */
/* Kullanıcılar                                                               */
/* -------------------------------------------------------------------------- */

function epostaUret(ad: string, sira: number): string {
  const harf: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', İ: 'i' };
  const sade = ad
    .split('')
    .map((k) => harf[k] ?? k)
    .join('')
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .split(' ')
    .filter(Boolean)
    .join('.');
  const saglayici = ['gmail.com', 'hotmail.com', 'outlook.com', 'yandex.com'][sira % 4];
  return `${sade}${sira % 3 === 0 ? sira : ''}@${saglayici}`;
}

export const profiller: Profile[] = (() => {
  const rnd = uretec(4646);
  const liste: Profile[] = [
    {
      id: 'p0',
      name: 'Osman Ali Elma',
      email: 'destek@saha46.app',
      role: 'admin',
      status: 'active',
      createdAt: BUGUN - 400 * GUN,
    },
  ];

  ADLAR.forEach((ad, i) => {
    // İlk 12 kullanıcı takım kurucusu, kalanı serbest oyuncu.
    const takim = i < takimlar.length ? takimlar[i].id : rnd() < 0.45 ? sec(rnd, takimlar).id : undefined;
    liste.push({
      id: `p${i + 1}`,
      name: ad,
      email: epostaUret(ad, i + 1),
      teamId: takim,
      role: 'user',
      status: 'active',
      createdAt: BUGUN - sayi(rnd, 5, 300) * GUN,
    });
  });

  // Birkaç hesap askıda olsun ki kuyruk gerçekçi görünsün.
  const askidakiler: Record<string, string> = {
    p14: 'Tekrarlanan sahte ilan',
    p21: 'Mesajlarda hakaret',
  };
  return liste.map((p) =>
    askidakiler[p.id]
      ? { ...p, status: 'suspended' as const, suspendedReason: askidakiler[p.id], suspendedAt: BUGUN - 6 * GUN }
      : p,
  );
})();

export const YONETICI = profiller[0];

/* -------------------------------------------------------------------------- */
/* İlanlar                                                                    */
/* -------------------------------------------------------------------------- */

const NOTLAR: Record<ListingKind, string[]> = {
  rakip: [
    'Rakip arıyoruz, seviye fark etmez. Saha ücreti ortak.',
    'Cumartesi akşamı için ciddi rakip arıyoruz.',
    'Rakibimiz son dakika iptal etti, yerine takım arıyoruz.',
    'Hakem bizden, saha ücreti yarı yarıya.',
    'Dostluk maçı, sert oynayan takım gelmesin.',
  ],
  oyuncu: [
    'Kadroda 2 kişi eksiğimiz var, orta saha arıyoruz.',
    'Bu haftaya defans oyuncusu arıyoruz.',
    'Forvet eksiğimiz var, düzenli oynayacak arkadaş olsun.',
  ],
  kaleci: [
    'Kalecimiz sakatlandı, bu maça kaleci arıyoruz.',
    'Düzenli oynayacak kaleci arıyoruz, ücret yok.',
  ],
  turnuva: [
    '16 takımlık turnuvamız için başvurular açık.',
    'Kupa formatında turnuva, kontenjan sınırlı.',
  ],
  kiralik: [
    'Boş olduğum akşamlar oynarım, orta saha oynuyorum.',
    'Kaleciyim, hafta içi her akşam müsaitim.',
    'Forvet oynuyorum, Onikişubat çevresinde takım arıyorum.',
  ],
};

const MEVKILER = ['Kaleci', 'Defans', 'Orta Saha', 'Forvet'];

export const ilanlar: Listing[] = (() => {
  const rnd = uretec(9090);
  const turler: ListingKind[] = [
    ...Array(18).fill('rakip'),
    ...Array(7).fill('oyuncu'),
    ...Array(5).fill('kaleci'),
    ...Array(4).fill('turnuva'),
    ...Array(6).fill('kiralik'),
  ];

  return turler.map((kind, i) => {
    const takim = sec(rnd, takimlar);
    const saha = sec(rnd, SAHALAR);
    // İlanların bir kısmı bugün, kalanı son 30 güne yayılıyor.
    const yas = i < 6 ? 0 : sayi(rnd, 0, 29);
    const olusma = BUGUN - yas * GUN - sayi(rnd, 0, 20) * 60 * 60 * 1000;
    const macGunu = BUGUN + sayi(rnd, 0, 12) * GUN;

    const temel: Listing = {
      id: `i${i + 1}`,
      teamId: takim.id,
      kind,
      date: new Date(macGunu + 3 * 60 * 60 * 1000).toISOString().slice(0, 10),
      time: sec(rnd, SAATLER),
      pitch: saha.ad,
      district: saha.district,
      format: takim.format,
      fee: sayi(rnd, 6, 14) * 100,
      note: sec(rnd, NOTLAR[kind]),
      createdAt: olusma,
    };

    if (rnd() < 0.22) temel.urgent = true;
    if (kind === 'oyuncu') temel.positions = [sec(rnd, MEVKILER.slice(1))];
    if (kind === 'kaleci') temel.positions = ['Kaleci'];
    if (kind === 'kiralik') {
      const kisi = sec(rnd, ADLAR);
      temel.playerName = kisi;
      temel.age = sayi(rnd, 18, 38);
      temel.positions = [sec(rnd, MEVKILER)];
      temel.fee = 0;
    }
    return temel;
  });
})();

/* -------------------------------------------------------------------------- */
/* Teklifler ve maçlar                                                        */
/* -------------------------------------------------------------------------- */

export const teklifler: Offer[] = (() => {
  const rnd = uretec(3131);
  const rakipIlanlar = ilanlar.filter((i) => i.kind === 'rakip');
  const liste: Offer[] = [];
  let sira = 1;

  rakipIlanlar.forEach((ilan) => {
    const adet = sayi(rnd, 0, 3);
    for (let k = 0; k < adet; k++) {
      const teklifEden = sec(rnd, takimlar.filter((t) => t.id !== ilan.teamId));
      const durum = rnd();
      liste.push({
        id: `o${sira++}`,
        listingId: ilan.id,
        teamId: teklifEden.id,
        status: durum < 0.45 ? 'pending' : durum < 0.75 ? 'accepted' : durum < 0.9 ? 'rejected' : 'cancelled',
        note: sec(rnd, [
          'Saati uyar, ücreti yarı yarıya paylaşalım.',
          'Bir saat erken başlayabilir miyiz?',
          'Kadromuz hazır, geliyoruz.',
          'Hakem konusunda anlaşabiliriz.',
        ]),
        createdAt: ilan.createdAt + sayi(rnd, 1, 40) * 60 * 60 * 1000,
      });
    }
  });
  return liste;
})();

export const maclar: Match[] = (() => {
  const rnd = uretec(7777);
  const liste: Match[] = [];

  for (let i = 0; i < 20; i++) {
    const rakip = sec(rnd, takimlar);
    const saha = sec(rnd, SAHALAR);
    const gecmis = i < 14; // çoğu oynanmış, kalanı yaklaşan
    const gun = gecmis ? -sayi(rnd, 1, 28) : sayi(rnd, 1, 10);
    const zaman = BUGUN + gun * GUN;

    const mac: Match = {
      id: `m${i + 1}`,
      opponentId: rakip.id,
      date: new Date(zaman + 3 * 60 * 60 * 1000).toISOString().slice(0, 10),
      time: sec(rnd, SAATLER),
      pitch: saha.ad,
      district: saha.district,
      format: rakip.format,
      fee: sayi(rnd, 6, 14) * 100,
      status: gecmis ? 'played' : 'upcoming',
      createdAt: zaman - sayi(rnd, 2, 10) * GUN,
    };

    if (gecmis) {
      mac.result = { us: sayi(rnd, 0, 7), them: sayi(rnd, 0, 7) };
      mac.rating = sayi(rnd, 2, 5);
    }
    liste.push(mac);
  }

  // Gelmeme bildirimleri: bazı takımlar birden fazla kez bildirilmiş olsun.
  const gelmeyenler: Record<string, number> = { t3: 3, t8: 2, t11: 2, t6: 1 };
  let sira = 100;
  Object.entries(gelmeyenler).forEach(([takimId, adet]) => {
    for (let k = 0; k < adet; k++) {
      const saha = sec(rnd, SAHALAR);
      const zaman = BUGUN - sayi(rnd, 1, 25) * GUN;
      liste.push({
        id: `m${sira++}`,
        opponentId: takimId,
        date: new Date(zaman + 3 * 60 * 60 * 1000).toISOString().slice(0, 10),
        time: sec(rnd, SAATLER),
        pitch: saha.ad,
        district: saha.district,
        format: takimlar.find((t) => t.id === takimId)!.format,
        fee: sayi(rnd, 6, 14) * 100,
        status: 'cancelled',
        noShow: true,
        createdAt: zaman - 3 * GUN,
      });
    }
  });

  return liste;
})();

/* -------------------------------------------------------------------------- */
/* Şikayetler                                                                 */
/* -------------------------------------------------------------------------- */

export const sikayetler: Report[] = [
  { id: 'r1', reporterId: 'p3', targetType: 'listing', targetId: 'i2', reason: 'sahte-ilan', detail: 'İlanda yazan saha o gün kapalıydı. Takım maça gelmedi, telefonu da açmadı.', status: 'open', createdAt: BUGUN - 4 * 60 * 60 * 1000 },
  { id: 'r2', reporterId: 'p7', targetType: 'team', targetId: 't3', reason: 'sahte-ilan', detail: 'Aynı saat için üç ayrı takımla anlaşmışlar, ikisini ekmişler.', status: 'open', createdAt: BUGUN - 9 * 60 * 60 * 1000 },
  { id: 'r3', reporterId: 'p11', targetType: 'profile', targetId: 'p21', reason: 'hakaret', detail: 'Maç sonrası mesajlarda küfür etti, ekran görüntüsü var.', status: 'open', createdAt: BUGUN - GUN },
  { id: 'r4', reporterId: 'p5', targetType: 'listing', targetId: 'i9', reason: 'spam', detail: 'Aynı ilanı gün içinde altı kez yeniden yayınladı.', status: 'open', createdAt: BUGUN - GUN - 5 * 60 * 60 * 1000 },
  { id: 'r5', reporterId: 'p18', targetType: 'team', targetId: 't8', reason: 'diger', detail: 'Saha ücretini paylaşmayı kabul edip maç sonunda ödemediler.', status: 'open', createdAt: BUGUN - 2 * GUN },
  { id: 'r6', reporterId: 'p2', targetType: 'profile', targetId: 'p14', reason: 'sahte-ilan', detail: 'Kiralık oyuncu ilanında kendini kaleci gösterip gelmedi.', status: 'open', createdAt: BUGUN - 2 * GUN - 8 * 60 * 60 * 1000 },
  { id: 'r7', reporterId: 'p9', targetType: 'team', targetId: 't3', reason: 'taciz', detail: 'Kadromuzdaki oyunculara ısrarla mesaj atıp transfer teklif ediyorlar.', status: 'open', createdAt: BUGUN - 3 * GUN },
  { id: 'r8', reporterId: 'p22', targetType: 'listing', targetId: 'i17', reason: 'sahte-ilan', detail: 'Yazan saha adı diye bir tesis yok.', status: 'open', createdAt: BUGUN - 4 * GUN },
  { id: 'r9', reporterId: 'p12', targetType: 'profile', targetId: 'p19', reason: 'hakaret', detail: 'Değerlendirme notunda hakaret içeren ifadeler var.', status: 'open', createdAt: BUGUN - 5 * GUN },
  { id: 'r10', reporterId: 'p6', targetType: 'team', targetId: 't11', reason: 'diger', detail: 'Maça 5 kişi geldiler, maç yarıda kaldı.', status: 'open', createdAt: BUGUN - 6 * GUN },
  { id: 'r11', reporterId: 'p4', targetType: 'listing', targetId: 'i25', reason: 'spam', detail: 'İlan metnine kendi işletmesinin reklamını koymuş.', status: 'resolved', resolvedBy: 'p0', resolvedAt: BUGUN - 6 * GUN, resolution: 'İlan kaldırıldı, kullanıcı uyarıldı.', createdAt: BUGUN - 7 * GUN },
  { id: 'r12', reporterId: 'p16', targetType: 'team', targetId: 't6', reason: 'sahte-ilan', detail: 'İlanda 8v8 yazıyordu, sahada 7v7 oynanacağını söylediler.', status: 'resolved', resolvedBy: 'p0', resolvedAt: BUGUN - 8 * GUN, resolution: 'Takıma uyarı gönderildi.', createdAt: BUGUN - 9 * GUN },
  { id: 'r13', reporterId: 'p20', targetType: 'profile', targetId: 'p13', reason: 'taciz', detail: 'Reddedilen teklif sonrası art arda mesaj attı.', status: 'dismissed', resolvedBy: 'p0', resolvedAt: BUGUN - 10 * GUN, resolution: 'Mesajlar incelendi, taciz kapsamına girmiyor.', createdAt: BUGUN - 11 * GUN },
  { id: 'r14', reporterId: 'p8', targetType: 'team', targetId: 't8', reason: 'hakaret', detail: 'Maç sırasında kadromuza hakaret ettiler.', status: 'resolved', resolvedBy: 'p0', resolvedAt: BUGUN - 12 * GUN, resolution: 'İki hafta ilan kısıtı uygulandı.', createdAt: BUGUN - 14 * GUN },
  { id: 'r15', reporterId: 'p24', targetType: 'listing', targetId: 'i31', reason: 'diger', detail: 'İlanda istenen ücret piyasanın çok üstünde, yanıltıcı.', status: 'dismissed', resolvedBy: 'p0', resolvedAt: BUGUN - 15 * GUN, resolution: 'Ücret belirlemek takımın kendi tercihi.', createdAt: BUGUN - 16 * GUN },
];

/* -------------------------------------------------------------------------- */
/* Turnuvalar                                                                 */
/* -------------------------------------------------------------------------- */

export const turnuvalar: Tournament[] = [
  { id: 'tr1', name: 'Maraş Yaz Kupası', organizer: 'Onikişubat Belediyesi', format: '7v7', quota: 16, fee: 2500, prize: 'Kupa + 20.000 ₺', startDate: '2026-09-05', pitch: 'Yıldırım Halı Saha', district: 'Onikişubat', status: 'open', createdAt: BUGUN - 12 * GUN },
  { id: 'tr2', name: 'Elbistan Şampiyonlar Turnuvası', organizer: 'Elbistan Arena', format: '8v8', quota: 12, fee: 3000, prize: 'Kupa + malzeme seti', startDate: '2026-09-14', pitch: 'Elbistan Arena', district: 'Elbistan', status: 'open', createdAt: BUGUN - 8 * GUN },
  { id: 'tr3', name: 'Afşin Dostluk Kupası', organizer: 'Afşin Yeşil Vadi', format: '7v7', quota: 8, fee: 1500, prize: 'Kupa', startDate: '2026-08-30', pitch: 'Afşin Yeşil Vadi', district: 'Afşin', status: 'closed', createdAt: BUGUN - 25 * GUN },
  { id: 'tr4', name: 'Kış Ligi Ön Kayıt', organizer: 'Saha46', format: '7v7', quota: 20, fee: 0, prize: 'Belirlenecek', startDate: '2026-11-02', pitch: 'Kapalı Spor Tesisi', district: 'Dulkadiroğlu', status: 'draft', createdAt: BUGUN - 2 * GUN },
];

export const basvurular: TournamentApplication[] = [
  { id: 'b1', tournamentId: 'tr1', teamId: 't1', status: 'pending', note: 'Kadromuz hazır, 14 kişiyiz.', createdAt: BUGUN - 2 * GUN },
  { id: 'b2', tournamentId: 'tr1', teamId: 't9', status: 'pending', note: 'Geçen sene finalist olduk.', createdAt: BUGUN - 2 * GUN },
  { id: 'b3', tournamentId: 'tr1', teamId: 't4', status: 'accepted', note: '', createdAt: BUGUN - 5 * GUN },
  { id: 'b4', tournamentId: 'tr1', teamId: 't10', status: 'rejected', note: 'Kontenjan doldu.', createdAt: BUGUN - 6 * GUN },
  { id: 'b5', tournamentId: 'tr2', teamId: 't12', status: 'accepted', note: 'Ev sahibi takım.', createdAt: BUGUN - 7 * GUN },
  { id: 'b6', tournamentId: 'tr2', teamId: 't2', status: 'pending', note: 'Ücreti taksitle ödeyebilir miyiz?', createdAt: BUGUN - GUN },
  { id: 'b7', tournamentId: 'tr2', teamId: 't5', status: 'pending', note: '', createdAt: BUGUN - GUN },
  { id: 'b8', tournamentId: 'tr3', teamId: 't6', status: 'accepted', note: '', createdAt: BUGUN - 20 * GUN },
];

/* -------------------------------------------------------------------------- */
/* İşlem kaydı                                                                */
/* -------------------------------------------------------------------------- */

export const kayitlar: AuditLog[] = (() => {
  const rnd = uretec(5151);
  const islemler: { action: string; targetType: string; not?: string }[] = [
    { action: 'şikayet çözüldü', targetType: 'report', not: 'İlan kaldırıldı, kullanıcı uyarıldı.' },
    { action: 'şikayet reddedildi', targetType: 'report', not: 'Kural ihlali bulunmadı.' },
    { action: 'ilan kaldırıldı', targetType: 'listing', not: 'Sahte ilan.' },
    { action: 'kullanıcı askıya alındı', targetType: 'profile', not: 'Tekrarlanan ihlal.' },
    { action: 'kullanıcı askısı kaldırıldı', targetType: 'profile' },
    { action: 'uyarı gönderildi', targetType: 'team', not: 'Sahaya gelmeme bildirimi.' },
    { action: 'ilan verme kısıtlandı', targetType: 'team', not: 'İki hafta süreyle.' },
    { action: 'turnuva başvurusu onaylandı', targetType: 'tournament' },
    { action: 'turnuva başvurusu reddedildi', targetType: 'tournament', not: 'Kontenjan doldu.' },
    { action: 'duyuru gönderildi', targetType: 'announcement', not: 'Tüm kullanıcılar.' },
    { action: 'gelmeme bildirimi geçersiz sayıldı', targetType: 'match', not: 'Karşı taraf haber vermiş.' },
    { action: 'hesap silindi', targetType: 'profile', not: 'KVKK talebi.' },
  ];

  const liste: AuditLog[] = [];
  for (let i = 0; i < 30; i++) {
    const islem = sec(rnd, islemler);
    liste.push({
      id: `l${i + 1}`,
      adminId: YONETICI.id,
      adminName: YONETICI.name,
      action: islem.action,
      targetType: islem.targetType,
      targetId: `${islem.targetType[0]}${sayi(rnd, 1, 20)}`,
      note: islem.not,
      createdAt: BUGUN - sayi(rnd, 0, 29) * GUN - sayi(rnd, 0, 23) * 60 * 60 * 1000,
    });
  }
  return liste.sort((a, b) => b.createdAt - a.createdAt);
})();

export const duyurular: Announcement[] = [
  {
    id: 'd1',
    title: 'Hafta sonu yoğunluğu',
    body: 'Cumartesi akşamı sahalar dolu. İlanınızı erken verirseniz teklif alma ihtimaliniz artar.',
    audience: { type: 'all' },
    createdAt: BUGUN - 9 * GUN,
  },
];

/** Ekranların tek seferde alacağı başlangıç durumu. */
export const baslangicVerisi = {
  takimlar,
  profiller,
  ilanlar,
  teklifler,
  maclar,
  sikayetler,
  turnuvalar,
  basvurular,
  kayitlar,
  duyurular,
};

export type Veri = typeof baslangicVerisi;
