/**
 * api/reprocess-file.cjs
 * Proxies to PDF Router's /api/reprocess-file.
 * Requires confirm: "REPROCESS".
 *
 * Timeout: 820s (Vercel Pro max function duration is 800s; we wait slightly
 * longer for the router to finish, then time out cleanly).
 *
 * If the router returns non-JSON (e.g. a Vercel error page on timeout),
 * we surface a clean error message instead of bubbling up a parse error.
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fileId, confirm } = req.body || {};
  if (!fileId)  return res.status(400).json({ error: 'fileId required' });
  if (confirm !== 'REPROCESS') return res.status(400).json({ error: 'confirm must equal "REPROCESS"' });

  const routerUrl = process.env.PDF_ROUTER_URL || 'https://grove-pdf-router.vercel.app';
  const secret    = process.env.PDF_ROUTER_CALLBACK_SECRET || 'abc123xyz';

  try {
    const response = await fetch(`${routerUrl}/api/reprocess-file`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fileId, confirm, secret }),
      signal:  AbortSignal.timeout(820000),  // 820s — slightly longer than Pro's 800s function max
    });

    // Read body as text first so we can gracefully handle HTML error pages
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      // Router returned non-JSON (most likely a Vercel 504 timeout HTML page)
      const snippet = text.slice(0, 200).replace(/<[^>]+>/g, '').trim().slice(0, 120);
      return res.status(response.status || 502).json({
        ok: false,
        error: `Router returned non-JSON response (HTTP ${response.status}). ` +
               `This usually means the reprocess took longer than the function timeout. ` +
               `Response snippet: "${snippet}"`,
      });
    }
    return res.status(response.status).json(data);

  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
    return res.status(isTimeout ? 504 : 500).json({
      ok:    false,
      error: isTimeout
        ? `Router did not respond within 820 seconds. Try reprocessing individual pages instead.`
        : err.message,
    });
  }
};
