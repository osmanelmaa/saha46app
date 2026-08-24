/**
 * POST /api/iletisim — Vercel Serverless Function.
 *
 * Ortak mantık lib/iletisim.mjs içindedir; bu dosya yalnızca Vercel'in
 * istek/yanıt biçimine çevirir. Cloudflare Pages'te aynı işi
 * functions/api/iletisim.js yapar.
 */

import { iletisimiIsle } from '../lib/iletisim.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, hata: 'Bu adres yalnızca form gönderimi içindir.' });
    return;
  }

  try {
    // Vercel gövdeyi çoğunlukla çözer; metin geldiyse elle ayrıştır.
    let govde = req.body;
    if (typeof govde === 'string') {
      try {
        govde = JSON.parse(govde);
      } catch {
        res.status(400).json({ ok: false, hata: 'Form okunamadı.' });
        return;
      }
    }

    const ulke = req.headers['x-vercel-ip-country'] || '-';
    const { durum, govde: yanit } = await iletisimiIsle(govde ?? {}, process.env, ulke);
    res.status(durum).json(yanit);
  } catch (e) {
    console.error('iletisim fonksiyonu hatasi', e);
    res.status(500).json({ ok: false, hata: 'Beklenmeyen bir hata oldu. E-posta ile yazabilirsin.' });
  }
}
