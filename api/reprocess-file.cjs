/**
 * api/reprocess-file.cjs
 * ───────────────────────
 * POST /api/reprocess-file
 * Body: { fileId: string, confirm: 'REPROCESS' }
 *
 * Proxies to the PDF Router's /api/reprocess-file endpoint.
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileId, confirm } = req.body || {};
  if (!fileId)  return res.status(400).json({ error: 'fileId required' });
  if (confirm !== 'REPROCESS') {
    return res.status(400).json({ error: 'confirm must equal "REPROCESS"' });
  }

  const routerUrl = process.env.PDF_ROUTER_URL || 'https://grove-pdf-router.vercel.app';
  const secret    = process.env.PDF_ROUTER_CALLBACK_SECRET || 'grove-pdf-router-secret';

  try {
    // Reprocess-all may take a while (one reprocess-page call per page)
    const response = await fetch(`${routerUrl}/api/reprocess-file`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fileId, confirm, secret }),
      signal:  AbortSignal.timeout(300000),  // 5 minutes
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
