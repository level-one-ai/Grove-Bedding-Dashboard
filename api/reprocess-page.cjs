/**
 * api/reprocess-page.cjs
 * ───────────────────────
 * POST /api/reprocess-page
 * Body: { fileId: string, pageNumber: number }
 *
 * Proxies to the PDF Router's /api/reprocess-page endpoint.
 * The secret is injected from PDF_ROUTER_CALLBACK_SECRET on the dashboard side.
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileId, pageNumber } = req.body || {};
  if (!fileId || !pageNumber) return res.status(400).json({ error: 'fileId and pageNumber required' });

  const routerUrl = process.env.PDF_ROUTER_URL || 'https://grove-pdf-router.vercel.app';
  const secret    = process.env.PDF_ROUTER_CALLBACK_SECRET || 'grove-pdf-router-secret';

  try {
    const response = await fetch(`${routerUrl}/api/reprocess-page`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fileId, pageNumber, secret }),
      // Reprocess can take time (download + extractor + Cin7 + uploads)
      signal:  AbortSignal.timeout(90000),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
