/**
 * api/reset-stuck-file.cjs
 * ─────────────────────────
 * POST /api/reset-stuck-file
 * Body: { fileId: string, action?: 'reset' | 'stop' }
 *
 * Proxies to the PDF Router's /api/reset-file endpoint.
 * The secret is read from the PDF_ROUTER_CALLBACK_SECRET env var
 * which must match the CALLBACK_SECRET on the PDF Router project.
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileId, action = 'reset' } = req.body || {};
  if (!fileId) return res.status(400).json({ error: 'fileId required' });

  const routerUrl = process.env.PDF_ROUTER_URL || 'https://grove-pdf-router.vercel.app';
  const secret    = process.env.PDF_ROUTER_CALLBACK_SECRET || 'grove-pdf-router-secret';

  try {
    const response = await fetch(`${routerUrl}/api/reset-file`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fileId, action, secret }),
      signal:  AbortSignal.timeout(10000),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
