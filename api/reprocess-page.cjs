/**
 * api/reprocess-page.cjs
 * Proxies to PDF Router's /api/reprocess-page with the secret injected.
 * Timeout: maxDuration set to 300s.
 */
async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileId, pageNumber } = req.body || {};
  if (!fileId || !pageNumber) return res.status(400).json({ error: 'fileId and pageNumber required' });

  const routerUrl = process.env.PDF_ROUTER_URL || 'https://grove-pdf-router.vercel.app';
  const secret    = process.env.PDF_ROUTER_CALLBACK_SECRET || 'abc123xyz';

  try {
    const response = await fetch(`${routerUrl}/api/reprocess-page`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fileId, pageNumber, secret }),
      signal:  AbortSignal.timeout(295000),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = handler;
module.exports.config = { maxDuration: 300 };
