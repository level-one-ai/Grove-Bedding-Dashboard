/**
 * api/scans-list.cjs
 * ──────────────────
 * GET  /api/scans-list        — list PDFs currently in the OneDrive Scans folder
 * POST /api/scans-list        — trigger the PDF Router to process the next file
 *
 * Uses Microsoft Graph API with the same credentials already set on the
 * PDF Router (MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET,
 * ONEDRIVE_USER_ID) — these must also be added to the Dashboard Vercel env vars.
 *
 * The PDF Router continues to run fully autonomously via Make.com.
 * This endpoint is read-only (GET) or a manual nudge (POST) — it does not
 * interfere with the automatic flow in any way.
 */

const https = require('https');

// ── Microsoft Graph auth ───────────────────────────────────────────────────

let tokenCache = { token: null, expiresAt: 0 };

async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60000) {
    return tokenCache.token;
  }

  const tenantId      = process.env.MICROSOFT_TENANT_ID;
  const clientId      = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret  = process.env.MICROSOFT_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Microsoft Graph credentials not configured. Add MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET to Vercel environment variables.');
  }

  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     clientId,
    client_secret: clientSecret,
    scope:         'https://graph.microsoft.com/.default',
  }).toString();

  const data = await httpPost(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    body,
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  );

  tokenCache = {
    token:     data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return tokenCache.token;
}

// ── Minimal HTTP helpers (no axios dependency on dashboard) ────────────────

function httpPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyBuf = Buffer.from(body);
    const options = {
      hostname: u.hostname,
      path:     u.pathname + u.search,
      method:   'POST',
      headers:  { ...headers, 'Content-Length': bodyBuf.length },
    };
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { resolve(raw); }
      });
    });
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path:     u.pathname + u.search,
      method:   'GET',
      headers,
    };
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, data: raw }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ── Handler ────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET — list PDFs in Scans folder ──────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const token  = await getAccessToken();
      const userId = process.env.ONEDRIVE_USER_ID;

      if (!userId) {
        return res.status(200).json({ success: false, error: 'ONEDRIVE_USER_ID not configured.', files: [] });
      }

      const folderPath = 'Grove Group Scotland/Grove Bedding/Scans';
      const graphUrl   = `https://graph.microsoft.com/v1.0/users/${userId}/drive/root:/${encodeURIComponent(folderPath)}:/children?$select=id,name,size,createdDateTime,file&$top=100`;

      const { status, data } = await httpGet(graphUrl, { Authorization: `Bearer ${token}` });

      if (status !== 200) {
        return res.status(200).json({
          success: false,
          error:   `Graph API returned ${status}: ${JSON.stringify(data?.error || data).slice(0, 200)}`,
          files:   [],
        });
      }

      const pdfs = (data?.value || [])
        .filter(item => {
          const name = (item.name || '').toLowerCase();
          const mime = item.file?.mimeType || '';
          // Exclude subfolders (no .file property) and non-PDFs
          return item.file && (name.endsWith('.pdf') || mime.includes('pdf'));
        })
        .sort((a, b) => new Date(a.createdDateTime) - new Date(b.createdDateTime))
        .map(item => ({
          id:          item.id,
          name:        item.name,
          sizeBytes:   item.size,
          createdAt:   item.createdDateTime,
        }));

      return res.status(200).json({ success: true, count: pdfs.length, files: pdfs });

    } catch (err) {
      console.error('[scans-list] GET error:', err.message);
      return res.status(200).json({ success: false, error: err.message, files: [] });
    }
  }

  // ── POST — trigger the PDF Router to process ─────────────────────────────
  if (req.method === 'POST') {
    try {
      const routerUrl = process.env.PDF_ROUTER_URL || 'https://grove-pdf-router.vercel.app';
      const triggerUrl = `${routerUrl}/api/scan-now`;

      // Fire-and-forget — scan-now responds immediately and processes in background
      const { status } = await httpPost(triggerUrl, '{}', { 'Content-Type': 'application/json' });

      console.log(`[scans-list] Triggered scan-now — status ${status}`);
      return res.status(200).json({ success: true, triggered: true, routerUrl: triggerUrl });

    } catch (err) {
      console.error('[scans-list] POST error:', err.message);
      return res.status(200).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
