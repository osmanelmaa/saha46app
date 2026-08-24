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

/* -------------------------------------------------------------------------- */
/* E-posta şablonu                                                            */
/* -------------------------------------------------------------------------- */

// Tasarım tokenları — sitedekilerle aynı.
const R = {
  bg: '#F3F7F9',
  surface: '#FFFFFF',
  surfaceAlt: '#ECF3F5',
  line: '#E0E8EB',
  brand: '#0097B2',
  primaryInk: '#00738A',
  primarySoft: '#E1F2F6',
  text: '#0A2A33',
  muted: '#546873',
  faint: '#879AA3',
};

const YAZI = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Gönderen bilgileri için tek satır. */
function bilgiSatiri(baslik, deger) {
  return `
            <tr>
              <td style="padding:6px 0;font:600 12px/1.5 ${YAZI};color:${R.faint};text-transform:uppercase;letter-spacing:.4px;white-space:nowrap;vertical-align:top;width:110px">${baslik}</td>
              <td style="padding:6px 0;font:500 14px/1.5 ${YAZI};color:${R.text};word-break:break-word">${deger}</td>
            </tr>`;
}

/**
 * Form mesajını okunaklı bir e-postaya çevirir.
 * E-posta istemcileri için tablo düzeni ve satır içi stil kullanılır;
 * harici stil dosyası ya da web fontu yüklenmez.
 */
export function epostaSablonu({ ad, eposta, konu, mesaj, ulke }) {
  // Gelen kutusu önizlemesi düz metin olmalı; etiketsiz ve kısa.
  const onizleme = kacir(mesaj.replace(/\s+/g, ' ')).slice(0, 120);

  const g = {
    ad: kacir(ad),
    eposta: kacir(eposta),
    konu: kacir(konu),
    ulke: kacir(ulke),
    mesaj: kacir(mesaj).replace(/\r?\n/g, '<br>'),
  };

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Saha46 · ${g.konu}</title>
</head>
<body style="margin:0;padding:0;background:${R.bg};">
  <!-- Gelen kutusu önizlemesinde mesajın ilk satırı görünsün -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${onizleme}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${R.bg};padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px">

          <!-- Başlık -->
          <tr>
            <td style="padding:0 4px 16px">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:10px">
                    <img src="https://saha46.app/assets/logo.png" width="36" height="36" alt="Saha46" style="display:block;border-radius:10px">
                  </td>
                  <td style="font:800 17px/1.2 ${YAZI};color:${R.text};letter-spacing:-.3px">Saha46</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Kart -->
          <tr>
            <td style="background:${R.surface};border:1px solid ${R.line};border-radius:18px;padding:26px">

              <p style="margin:0 0 6px;font:600 12px/1.4 ${YAZI};color:${R.faint};text-transform:uppercase;letter-spacing:.4px">Destek formundan yeni mesaj</p>
              <h1 style="margin:0 0 18px;font:800 22px/1.25 ${YAZI};color:${R.text};letter-spacing:-.5px">${g.konu}</h1>

              <!-- Mesaj -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${R.surfaceAlt};border-radius:14px;padding:16px 18px;font:500 15px/1.6 ${YAZI};color:${R.text};word-break:break-word">${g.mesaj}</td>
                </tr>
              </table>

              <!-- Gönderen -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;border-top:1px solid ${R.line}">
                <tr><td colspan="2" style="padding:16px 0 4px;font:700 13px/1.4 ${YAZI};color:${R.text}">Gönderen</td></tr>
                ${bilgiSatiri('Ad', g.ad)}
                ${bilgiSatiri('E-posta', `<a href="mailto:${g.eposta}" style="color:${R.primaryInk};text-decoration:none">${g.eposta}</a>`)}
                ${bilgiSatiri('Ülke', g.ulke)}
              </table>

              <!-- Yanıt notu -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px">
                <tr>
                  <td style="background:${R.primarySoft};border-radius:12px;padding:12px 16px;font:500 13px/1.5 ${YAZI};color:${R.primaryInk}">
                    Bu mesaja <strong>Yanıtla</strong> dediğinizde yanıtınız doğrudan gönderene ulaşır.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Alt bilgi -->
          <tr>
            <td style="padding:16px 4px 0;font:500 12px/1.6 ${YAZI};color:${R.faint}">
              Bu bildirim <a href="https://saha46.app/destek/" style="color:${R.faint}">saha46.app/destek</a> sayfasındaki iletişim formundan oluşturuldu.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Düz metin sürümü — HTML göstermeyen istemciler için. */
function duzMetin({ ad, eposta, konu, mesaj, ulke }) {
  return [
    konu,
    '='.repeat(konu.length),
    '',
    mesaj,
    '',
    '---',
    `Gönderen : ${ad}`,
    `E-posta  : ${eposta}`,
    `Ülke     : ${ulke}`,
    '',
    'Bu mesaj saha46.app destek sayfasındaki iletişim formundan gönderildi.',
    'Yanıtla dediğinizde doğrudan gönderene ulaşır.',
  ].join('\n');
}

/* -------------------------------------------------------------------------- */
/* İşleyici                                                                   */
/* -------------------------------------------------------------------------- */

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

  const veri = { ad, eposta, konu, mesaj, ulke };

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
      subject: `${konu} · ${ad}`,
      text: duzMetin(veri),
      html: epostaSablonu(veri),
    }),
  });

  if (!yanit.ok) {
    console.error('Resend hatası', yanit.status, await yanit.text());
    return { durum: 502, govde: { ok: false, hata: 'Mesaj gönderilemedi. E-posta ile yazabilirsin.' } };
  }

  return { durum: 200, govde: { ok: true } };
}
