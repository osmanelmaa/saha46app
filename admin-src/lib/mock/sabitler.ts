/**
 * Sahte verinin ortak parçaları.
 *
 * Veri deterministik üretilir: aynı tohum her zaman aynı listeyi verir.
 * Böylece statik dışa aktarımda sunucu ve tarayıcı aynı içeriği görür,
 * hydration uyuşmazlığı çıkmaz.
 */

import type { Ilce, Seviye } from '../tipler';

/** Demo verinin "bugün" kabul ettiği an. Date.now() kullanılmaz. */
export const BUGUN = Date.parse('2026-08-24T09:00:00+03:00');
export const GUN = 24 * 60 * 60 * 1000;

/** mulberry32 — küçük, tohumlanabilir sözde rastgele üreteç. */
export function uretec(tohum: number) {
  let t = tohum >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function sec<T>(rnd: () => number, dizi: readonly T[]): T {
  return dizi[Math.floor(rnd() * dizi.length)];
}

export function sayi(rnd: () => number, en: number, boy: number): number {
  return en + Math.floor(rnd() * (boy - en + 1));
}

export const ILCELER: readonly Ilce[] = [
  'Onikişubat',
  'Dulkadiroğlu',
  'Elbistan',
  'Afşin',
  'Türkoğlu',
  'Pazarcık',
];

export const SEVIYELER: readonly Seviye[] = ['Amatör', 'Orta', 'İddialı', 'Profesyonel'];

export const SAHALAR: readonly { ad: string; district: Ilce }[] = [
  { ad: 'Yıldırım Halı Saha', district: 'Onikişubat' },
  { ad: 'Elbistan Arena', district: 'Elbistan' },
  { ad: 'Kapalı Spor Tesisi', district: 'Dulkadiroğlu' },
  { ad: 'Türkoğlu Sport Center', district: 'Türkoğlu' },
  { ad: 'Afşin Yeşil Vadi', district: 'Afşin' },
  { ad: 'Menzelet Halı Saha', district: 'Onikişubat' },
  { ad: 'Yörükselim Halı Saha', district: 'Onikişubat' },
  { ad: 'Pazarcık Gençlik Sahası', district: 'Pazarcık' },
  { ad: 'Ahır Dağı Tesisleri', district: 'Dulkadiroğlu' },
];

export const SAATLER = ['19:00', '20:00', '21:00', '22:00', '23:00'] as const;

export const ADLAR = [
  'Mehmet Karataş',
  'Ahmet Yılmaz',
  'Emre Şahin',
  'Burak Doğan',
  'Hasan Kılıç',
  'Yusuf Aydın',
  'Mustafa Çetin',
  'Ali Öztürk',
  'Enes Kaya',
  'Serkan Güneş',
  'Fatih Aslan',
  'Okan Demir',
  'Ramazan Yıldız',
  'Kadir Uzun',
  'Sinan Bozkurt',
  'Volkan Erdem',
  'Hüseyin Tunç',
  'Metin Arslan',
  'Cihan Polat',
  'Barış Şimşek',
  'Onur Çelik',
  'Umut Koç',
  'Tolga Ateş',
  'Furkan Sarı',
  'İbrahim Özdemir',
  'Kemal Yavuz',
  'Selim Akgün',
  'Deniz Korkmaz',
] as const;

/** Takım renkleri tasarım paletinden seçilir. */
export const RENKLER = ['#0097B2', '#00738A', '#005061', '#0A2A33', '#00BF63', '#0B7A43', '#B45309', '#CE2532'] as const;

export const DIZILISLER_7 = ['7-231', '7-222', '7-321', '7-141', '7-312'] as const;
export const DIZILISLER_8 = ['8-332', '8-341', '8-323', '8-242', '8-431'] as const;
