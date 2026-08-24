/**
 * Biçimlendirme yardımcıları.
 *
 * Tüm tarihler Türkiye saatine (UTC+3) sabitlenerek yazılır. Yerel saat
 * dilimine bakılmaz; böylece statik dışa aktarımda derleme makinesi ile
 * tarayıcı aynı metni üretir.
 */

import { BUGUN, GUN } from './mock/sabitler';

const OFSET = 3 * 60 * 60 * 1000;
const iki = (n: number) => String(n).padStart(2, '0');

function trZaman(zaman: number) {
  return new Date(zaman + OFSET);
}

export function tarih(zaman: number): string {
  const d = trZaman(zaman);
  return `${iki(d.getUTCDate())}.${iki(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

export function tarihSaat(zaman: number): string {
  const d = trZaman(zaman);
  return `${tarih(zaman)} ${iki(d.getUTCHours())}:${iki(d.getUTCMinutes())}`;
}

/** "bugün", "dün", "3 gün önce" gibi kısa anlatım. */
export function gecenSure(zaman: number): string {
  const fark = BUGUN - zaman;
  if (fark < 0) return tarih(zaman);
  const gun = Math.floor(fark / GUN);
  if (gun === 0) {
    const saat = Math.floor(fark / (60 * 60 * 1000));
    if (saat < 1) return 'az önce';
    return `${saat} saat önce`;
  }
  if (gun === 1) return 'dün';
  if (gun < 30) return `${gun} gün önce`;
  return tarih(zaman);
}

export function bugunMu(zaman: number): boolean {
  return tarih(zaman) === tarih(BUGUN);
}

export function para(tutar: number): string {
  return `${tutar.toLocaleString('tr-TR')} ₺`;
}

/**
 * Türkçe karakterlere duyarlı arama.
 * toLowerCase yerine localeCompare tabanlı karşılaştırma kullanılır;
 * "İSTANBUL" ile "istanbul", "ŞAHİN" ile "şahin" eşleşir.
 */
export function icerir(metin: string, aranan: string): boolean {
  const a = aranan.trim();
  if (!a) return true;
  const m = metin.normalize('NFC');
  const h = a.normalize('NFC');
  const uzunluk = h.length;
  for (let i = 0; i + uzunluk <= m.length; i++) {
    if (m.substring(i, i + uzunluk).localeCompare(h, 'tr', { sensitivity: 'base' }) === 0) {
      return true;
    }
  }
  return false;
}
