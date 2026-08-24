/**
 * POST /api/iletisim — destek sayfasındaki iletişim formunu e-postaya çevirir.
 *
 * Gerekli ortam değişkenleri (Cloudflare Pages → Settings → Environment variables):
 *   RESEND_API_KEY  Resend API anahtarı
 *   MAIL_TO         mesajların düşeceği adres (örn. destek@saha46.app)
 *   MAIL_FROM       gönderen adres, Resend'de doğrulanmış alan adından
 *                   (örn. "Saha46 <form@saha46.app>")
 */

const SINIR = { ad: 80, eposta: 160, konu: 60, mesaj: 4000 };

const KONULAR = [
  "Sorun bildirimi",
  "Hesap ve veri talebi",
  "Kullanıcı ya da ilan şikâyeti",
  "Öneri",
  "Diğer",
];

function json(veri, durum = 200) {
  return new Response(JSON.stringify(veri), {
    status: durum,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function temizle(deger, uzunluk) {
  return typeof deger === "string" ? deger.trim().slice(0, uzunluk) : "";
}

function kacir(metin) {
  return metin.replace(/[&<>"]/g, (k) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[k]));
}

async function formuIsle({ request, env }) {
  let govde;
  try {
    govde = await request.json();
  } catch {
    return json({ ok: false, hata: "Form okunamadı." }, 400);
  }

  // Bal küpü: botlar bu gizli alanı doldurur. Sessizce başarılı yanıt ver.
  if (temizle(govde.website, 100)) return json({ ok: true });

  const ad = temizle(govde.ad, SINIR.ad);
  const eposta = temizle(govde.eposta, SINIR.eposta);
  const konu = KONULAR.includes(govde.konu) ? govde.konu : "Diğer";
  const mesaj = temizle(govde.mesaj, SINIR.mesaj);

  if (!ad || !eposta || !mesaj) {
    return json({ ok: false, hata: "Ad, e-posta ve mesaj alanlarını doldur." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(eposta)) {
    return json({ ok: false, hata: "E-posta adresi geçerli görünmüyor." }, 400);
  }
  if (mesaj.length < 10) {
    return json({ ok: false, hata: "Mesajını biraz daha açar mısın?" }, 400);
  }

  if (!env.RESEND_API_KEY || !env.MAIL_TO || !env.MAIL_FROM) {
    return json({ ok: false, hata: "Form şu an kapalı. Lütfen e-posta ile yaz." }, 503);
  }

  const ulke = request.headers.get("cf-ipcountry") || "-";
  const metin =
    `Konu: ${konu}\n` +
    `Ad: ${ad}\n` +
    `E-posta: ${eposta}\n` +
    `Ülke: ${ulke}\n` +
    `\n${mesaj}\n`;

  const yanit = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
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
    console.error("Resend hatası", yanit.status, await yanit.text());
    return json({ ok: false, hata: "Mesaj gönderilemedi. E-posta ile yazabilirsin." }, 502);
  }

  return json({ ok: true });
}

export async function onRequest(baglam) {
  if (baglam.request.method !== "POST") {
    return json({ ok: false, hata: "Bu adres yalnızca form gönderimi içindir." }, 405);
  }
  try {
    return await formuIsle(baglam);
  } catch (e) {
    console.error("iletisim fonksiyonu hatasi", e);
    return json({ ok: false, hata: "Beklenmeyen bir hata oldu. E-posta ile yazabilirsin." }, 500);
  }
}
