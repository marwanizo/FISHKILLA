/* ============================================================
   FISH KILLA — NO LIMIT | api/notify.js
   Vercel Serverless Function
   - Incrémente le compteur de téléchargements (Upstash Redis)
   - Envoie un reçu dans le groupe Telegram du producteur
   ============================================================ */

export default async function handler(req, res) {
  /* CORS pour les appels depuis le front */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { contact } = req.body || {};
  if (!contact || contact.trim().length < 3) {
    return res.status(400).json({ error: 'Contact invalide' });
  }

  const botToken  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId    = process.env.TELEGRAM_CHAT_ID;
  const redisUrl  = process.env.UPSTASH_REDIS_REST_URL;
  const redisAuth = process.env.UPSTASH_REDIS_REST_TOKEN;

  /* ---------- 1. Incrémenter le compteur ---------- */
  let count = '?';
  try {
    const r = await fetch(`${redisUrl}/incr/fishkilla_dl_count`, {
      headers: { Authorization: `Bearer ${redisAuth}` }
    });
    const data = await r.json();
    count = data.result;
  } catch (e) {
    console.error('[Redis] Erreur compteur :', e.message);
  }

  /* ---------- 2. Formater la date (Paris) ---------- */
  const date = new Date().toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  /* ---------- 3. Composer le message Telegram ---------- */
  const ordinal = count !== '?' && count === 1 ? '1er' : `${count}ème`;
  const message = [
    `🔥 *FISH KILLA — NO LIMIT*`,
    ``,
    `🧾 *REÇU DE TÉLÉCHARGEMENT — #${count}*`,
    ``,
    `📱 Contact : \`${contact.trim()}\``,
    `📅 Date : ${date}`,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `📊 *Nombre total d'achats : ${count}*`,
    `━━━━━━━━━━━━━━━━━━`,
    ``,
    `_Ceci est le ${ordinal} téléchargement de l'album._`
  ].join('\n');

  /* ---------- 4. Envoyer vers Telegram ---------- */
  try {
    const tgRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      }
    );
    if (!tgRes.ok) {
      const err = await tgRes.text();
      console.error('[Telegram] Erreur :', err);
    }
  } catch (e) {
    console.error('[Telegram] Fetch error :', e.message);
  }

  return res.status(200).json({ success: true, count });
}
