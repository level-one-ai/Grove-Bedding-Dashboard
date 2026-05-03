/**
 * api/reset-stuck-file.cjs
 * ─────────────────────────
 * POST /api/reset-stuck-file
 * Body: { fileId: string, action?: 'reset' | 'stop' }
 *
 * reset (default) — clears stuck status so the file is reprocessed
 * stop            — marks file as stopped/error so it won't be picked up again
 *
 * Proxies to the PDF Router's /api/reset-file endpoint.
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileId, action = 'reset' } = req.body || {};
  if (!fileId) return res.status(400).json({ error: 'fileId required' });

  const routerUrl = process.env.PDF_ROUTER_URL || 'https://grove-pdf-router.vercel.app';

  try {
    const response = await fetch(`${routerUrl}/api/reset-file`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        fileId,
        action,
        secret: 'grove-pdf-router-secret',
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(200).json({ ok: false, error: err.message });
  }
};
