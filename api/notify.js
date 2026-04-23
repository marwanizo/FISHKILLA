/* ============================================================
   FISH KILLA — NO LIMIT | api/notify.js  (CommonJS)
   Vercel Serverless Function
   - Incrémente le compteur via Upstash Redis
   - Génère un reçu PDF numéroté (RECU00001, RECU00002…)
   - Envoie le PDF dans le groupe Telegram du producteur
   ============================================================ */
'use strict';

const PDFDocument = require('pdfkit');

/* ---------- PDF receipt generator ---------- */
function generateReceipt(receiptNum, count, contact, date) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, compress: true });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 595.28;
    const ORANGE = '#E8490C';
    const DARK   = '#0c0300';
    const WHITE  = '#FFFFFF';
    const GREY   = '#888888';
    const BLACK  = '#111111';

    /* ---- Header orange ---- */
    doc.rect(0, 0, W, 115).fill(ORANGE);

    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(30)
       .text('FISH KILLA', 40, 22);
    doc.font('Helvetica').fontSize(13)
       .text('NO LIMIT  \u2014  2026', 40, 62);

    /* Receipt number top-right */
    doc.font('Helvetica-Bold').fontSize(12)
       .text(receiptNum, 40, 30, { width: W - 80, align: 'right' });

    /* ---- Title ---- */
    doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(18)
       .text('RECU DE TELECHARGEMENT', 40, 140);

    /* Orange underline */
    doc.moveTo(40, 168).lineTo(W - 40, 168)
       .strokeColor(ORANGE).lineWidth(2).stroke();

    /* ---- Info rows ---- */
    const rows = [
      ['NUMERO DE RECU',      receiptNum],
      ['DATE',                date],
      ['CONTACT',             contact],
      ['ALBUM',               'FISH KILLA \u2014 NO LIMIT'],
      ['STATUT',              '\u2713  Telechargement confirme'],
      ["NOMBRE TOTAL D'ACHATS", String(count)],
    ];

    let y = 188;
    rows.forEach(([label, value], i) => {
      /* Alternate row background */
      if (i % 2 === 0) doc.rect(40, y - 4, W - 80, 44).fill('#F9F9F9').stroke('#F9F9F9');

      doc.fillColor(GREY).font('Helvetica').fontSize(9)
         .text(label, 50, y + 2);
      doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(12)
         .text(value, 50, y + 16, { width: W - 100 });

      /* Thin separator */
      doc.moveTo(40, y + 40).lineTo(W - 40, y + 40)
         .strokeColor('#DDDDDD').lineWidth(0.4).stroke();
      y += 48;
    });

    /* ---- Decorative total box ---- */
    const boxY = y + 20;
    doc.roundedRect(40, boxY, W - 80, 56, 6).fill(DARK);
    doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(11)
       .text("TOTAL ACHATS CUMULES", 50, boxY + 10);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(22)
       .text(String(count), 50, boxY + 26);

    /* ---- Footer ---- */
    const footY = 780;
    doc.rect(0, footY, W, 62).fill(DARK);
    doc.fillColor(ORANGE).font('Helvetica-Bold').fontSize(10)
       .text('Powered by NFC FOR YOU', 0, footY + 14, { align: 'center', width: W });
    doc.fillColor('rgba(255,255,255,0.4)').font('Helvetica').fontSize(8)
       .text('Cet album est reserve au proprietaire de la carte NFC.', 0, footY + 32, { align: 'center', width: W });

    doc.end();
  });
}

/* ---------- Main handler ---------- */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { contact } = req.body || {};
  if (!contact || contact.trim().length < 3) {
    return res.status(400).json({ error: 'Contact invalide' });
  }

  const botToken  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId    = process.env.TELEGRAM_CHAT_ID;
  const redisUrl  = process.env.UPSTASH_REDIS_REST_URL;
  const redisAuth = process.env.UPSTASH_REDIS_REST_TOKEN;

  /* ---------- 1. Incrémenter le compteur ---------- */
  let count = 1;
  try {
    const r = await fetch(`${redisUrl}/incr/fishkilla_dl_count`, {
      headers: { Authorization: `Bearer ${redisAuth}` }
    });
    const data = await r.json();
    count = data.result || 1;
  } catch (e) {
    console.error('[Redis]', e.message);
  }

  /* ---------- 2. Formater la date (Paris) ---------- */
  const date = new Date().toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const receiptNum = `RECU${String(count).padStart(5, '0')}`;

  /* ---------- 3. Générer le PDF ---------- */
  let pdfBuffer = null;
  try {
    pdfBuffer = await generateReceipt(receiptNum, count, contact.trim(), date);
  } catch (e) {
    console.error('[PDF]', e.message);
  }

  /* ---------- 4. Composer la caption Telegram ---------- */
  const ordinal = count === 1 ? '1er' : `${count}e`;
  const caption = [
    `\uD83D\uDD25 *FISH KILLA \u2014 NO LIMIT*`,
    ``,
    `\uD83E\uDDFE *${receiptNum}*`,
    ``,
    `\uD83D\uDCF1 Contact : \`${contact.trim()}\``,
    `\uD83D\uDCC5 Date : ${date}`,
    ``,
    `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`,
    `\uD83D\uDCCA *Nombre total d'achats : ${count}*`,
    `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501`,
    ``,
    `_Ceci est le ${ordinal} telechargement._`
  ].join('\n');

  const tgBase = `https://api.telegram.org/bot${botToken}`;

  /* ---------- 5. Envoyer vers Telegram ---------- */
  try {
    if (pdfBuffer) {
      /* Send PDF document with caption */
      const form = new FormData();
      form.append('chat_id', String(chatId));
      form.append('document', new Blob([pdfBuffer], { type: 'application/pdf' }), `${receiptNum}.pdf`);
      form.append('caption', caption);
      form.append('parse_mode', 'Markdown');

      const tgRes = await fetch(`${tgBase}/sendDocument`, { method: 'POST', body: form });
      if (!tgRes.ok) {
        console.error('[Telegram sendDocument]', await tgRes.text());
        /* Fallback: send text only */
        await fetch(`${tgBase}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: caption, parse_mode: 'Markdown' })
        });
      }
    } else {
      /* PDF failed — send text only */
      await fetch(`${tgBase}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: caption, parse_mode: 'Markdown' })
      });
    }
  } catch (e) {
    console.error('[Telegram]', e.message);
  }

  return res.status(200).json({ success: true, count, receiptNum });
};
