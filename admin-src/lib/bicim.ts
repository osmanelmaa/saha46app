/**
 * Biçimlendirme yardımcıları.
 *
 * Veritabanından gelen tarihler ISO metindir (timestamptz). Hepsi
 * Türkiye saatine (UTC+3) sabitlenerek yazılır; tarayıcının yerel saat
 * dilimine bakılmaz, böylece herkes aynı saati görür.
 */

const OFSET = 3 * 60 * 60 * 1000;
const iki = (n: number) => String(n).padStart(2, '0');

function cozumle(deger: string | null | undefined): Date | null {
  if (!deger) return null;
  const t = Date.parse(deger);
  return Number.isNaN(t) ? null : new Date(t + OFSET);
}

export function tarih(deger: string | null | undefined): string {
  const d = cozumle(deger);
  if (!d) return '—';
  return `${iki(d.getUTCDate())}.${iki(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

export function saat(deger: string | null | undefined): string {
  const d = cozumle(deger);
  if (!d) return '—';
  return `${iki(d.getUTCHours())}:${iki(d.getUTCMinutes())}`;
}

export function tarihSaat(deger: string | null | undefined): string {
  const d = cozumle(deger);
  if (!d) return '—';
  return `${tarih(deger)} ${saat(deger)}`;
}

/** "az önce", "3 saat önce", "dün", "5 gün önce" — eskiyse tam tarih. */
export function gecenSure(deger: string | null | undefined): string {
  const t = deger ? Date.parse(deger) : NaN;
  if (Number.isNaN(t)) return '—';
  const fark = Date.now() - t;
  if (fark < 0) return tarih(deger);

  const dakika = Math.floor(fark / 60000);
  if (dakika < 1) return 'az önce';
  if (dakika < 60) return `${dakika} dakika önce`;

  const saatFarki = Math.floor(dakika / 60);
  if (saatFarki < 24) return `${saatFarki} saat önce`;

  const gun = Math.floor(saatFarki / 24);
  if (gun === 1) return 'dün';
  if (gun < 30) return `${gun} gün önce`;
  return tarih(deger);
}

/** Kayıt bugün mü oluşturulmuş? (Türkiye saatine göre) */
export function bugunMu(deger: string | null | undefined): boolean {
  if (!deger) return false;
  return tarih(deger) === tarih(new Date().toISOString());
}

/** Son n gün içinde mi? */
export function sonGunlerde(deger: string | null | undefined, gun: number): boolean {
  const t = deger ? Date.parse(deger) : NaN;
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= gun * 24 * 60 * 60 * 1000;
}

export function para(tutar: number | null | undefined): string {
  if (typeof tutar !== 'number') return '—';
  return `${tutar.toLocaleString('tr-TR')} ₺`;
}

/**
 * Türkçe karakterlere duyarlı arama.
 * toLowerCase yerine locale karşılaştırması kullanılır; "sahin" ile
 * "Şahin", "ISITMA" ile "ısıtma" eşleşir.
 */
export function icerir(metin: string | null | undefined, aranan: string): boolean {
  const a = aranan.trim();
  if (!a) return true;
  if (!metin) return false;
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
