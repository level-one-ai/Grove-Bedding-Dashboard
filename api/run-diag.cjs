/**
 * api/run-diag.cjs
 * ────────────────
 * GET /api/run-diag
 *
 * Proxies a call to the PDF Router's /api/diag endpoint and returns
 * the JSON result to the dashboard frontend.
 *
 * The PDF Router URL is read from the PDF_ROUTER_URL env var,
 * defaulting to the live deployment.
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const routerUrl = process.env.PDF_ROUTER_URL || 'https://grove-pdf-router.vercel.app';
  const diagUrl   = `${routerUrl}/api/diag`;

  try {
    const response = await fetch(diagUrl, {
      method:  'GET',
      headers: { 'Accept': 'application/json' },
      signal:  AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      return res.status(200).json({
        ok: false,
        summary: `PDF Router responded with HTTP ${response.status}`,
        results: [],
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(200).json({
      ok: false,
      summary: `Could not reach PDF Router at ${diagUrl}: ${err.message}`,
      results: [],
    });
  }
};
