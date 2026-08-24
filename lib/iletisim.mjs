/**
 * İletişim formunun ortak mantığı.
 *
 * Platformdan bağımsızdır: doğrulamayı yapar ve Resend üzerinden e-postayı
 * gönderir. Cloudflare Pages Functions ve Vercel Serverless Functions
 * sarmalayıcıları bu dosyayı çağırır, böylece kural tek yerde durur.
 *
 * Gerekli ortam değişkenleri:
 *   RESEND_API_KEY  Resend API anahtarı
 *   MAIL_TO         mesajların düşeceği adres (örn. destek@saha46.app)
 *   MAIL_FROM       gönderen adres, Resend'de doğrulanmış alan adından
 */

const SINIR = { ad: 80, eposta: 160, mesaj: 4000 };

export const KONULAR = [
  'Sorun bildirimi',
  'Hesap ve veri talebi',
  'Kullanıcı ya da ilan şikâyeti',
  'Öneri',
  'Diğer',
];

function temizle(deger, uzunluk) {
  return typeof deger === 'string' ? deger.trim().slice(0, uzunluk) : '';
}

function kacir(metin) {
  return metin.replace(/[&<>"]/g, (k) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[k]);
}

/**
 * Formu işler.
 * @returns {Promise<{durum: number, govde: object}>} yanıt kodu ve gövdesi
 */
export async function iletisimiIsle(govde, env, ulke = '-') {
  // Bal küpü: botlar bu gizli alanı doldurur. Sessizce başarılı yanıt ver.
  if (temizle(govde?.website, 100)) return { durum: 200, govde: { ok: true } };

  const ad = temizle(govde?.ad, SINIR.ad);
  const eposta = temizle(govde?.eposta, SINIR.eposta);
  const konu = KONULAR.includes(govde?.konu) ? govde.konu : 'Diğer';
  const mesaj = temizle(govde?.mesaj, SINIR.mesaj);

  if (!ad || !eposta || !mesaj) {
    return { durum: 400, govde: { ok: false, hata: 'Ad, e-posta ve mesaj alanlarını doldur.' } };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(eposta)) {
    return { durum: 400, govde: { ok: false, hata: 'E-posta adresi geçerli görünmüyor.' } };
  }
  if (mesaj.length < 10) {
    return { durum: 400, govde: { ok: false, hata: 'Mesajını biraz daha açar mısın?' } };
  }

  if (!env.RESEND_API_KEY || !env.MAIL_TO || !env.MAIL_FROM) {
    return { durum: 503, govde: { ok: false, hata: 'Form şu an kapalı. Lütfen e-posta ile yaz.' } };
  }

  const metin =
    `Konu: ${konu}\n` +
    `Ad: ${ad}\n` +
    `E-posta: ${eposta}\n` +
    `Ülke: ${ulke}\n` +
    `\n${mesaj}\n`;

  const yanit = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [env.MAIL_TO],
      reply_to: eposta,
      subject: `Saha46 · ${konu} · ${ad}`,
      text: metin,
      html:
        `<p><strong>Konu:</strong> ${kacir(konu)}<br>` +
        `<strong>Ad:</strong> ${kacir(ad)}<br>` +
        `<strong>E-posta:</strong> ${kacir(eposta)}<br>` +
        `<strong>Ülke:</strong> ${kacir(ulke)}</p>` +
        `<p style="white-space:pre-wrap">${kacir(mesaj)}</p>`,
    }),
  });

  if (!yanit.ok) {
    console.error('Resend hatası', yanit.status, await yanit.text());
    return { durum: 502, govde: { ok: false, hata: 'Mesaj gönderilemedi. E-posta ile yazabilirsin.' } };
  }

  return { durum: 200, govde: { ok: true } };
}
