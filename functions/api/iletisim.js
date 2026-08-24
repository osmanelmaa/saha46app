/**
 * POST /api/iletisim — Cloudflare Pages Function.
 *
 * Ortak mantık lib/iletisim.mjs içindedir; bu dosya yalnızca Cloudflare'in
 * istek/yanıt biçimine çevirir. Vercel'de aynı işi api/iletisim.mjs yapar.
 */

import { iletisimiIsle } from '../../lib/iletisim.mjs';

function json(veri, durum = 200) {
  return new Response(JSON.stringify(veri), {
    status: durum,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return json({ ok: false, hata: 'Bu adres yalnızca form gönderimi içindir.' }, 405);
  }

  let govde;
  try {
    govde = await request.json();
  } catch {
    return json({ ok: false, hata: 'Form okunamadı.' }, 400);
  }

  try {
    const ulke = request.headers.get('cf-ipcountry') || '-';
    const { durum, govde: yanit } = await iletisimiIsle(govde, env, ulke);
    return json(yanit, durum);
  } catch (e) {
    console.error('iletisim fonksiyonu hatasi', e);
    return json({ ok: false, hata: 'Beklenmeyen bir hata oldu. E-posta ile yazabilirsin.' }, 500);
  }
}
