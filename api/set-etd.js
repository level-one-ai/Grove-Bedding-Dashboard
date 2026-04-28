/**
 * label-print-service/api/set-etd.js
 * ─────────────────────────────────────
 * POST /api/set-etd
 *
 * Updates the ETD (Estimated Time of Delivery) date on a Cin7 Omni sales order.
 * Uses ETD_FIELD_NAME env var to know which field to update.
 *
 * Body: { orderId, orderNumber, etdDate }  (etdDate: "2026-06-15")
 *
 * Environment variables required:
 *   CIN7_API_KEY
 *   CIN7_API_USERNAME  (e.g. GroveGroupScotlaUK)
 *   ETD_FIELD_NAME
 */

const CIN7_BASE = 'https://api.cin7.com/api/v1';

function cin7Headers(apiUser, apiKey) {
  const credentials = Buffer.from(`${apiUser}:${apiKey}`).toString('base64');
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type':  'application/json',
    'Accept':        'application/json',
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { orderId, orderNumber, etdDate } = body ?? {};

  if (!orderId && !orderNumber) return res.status(400).json({ success: false, error: 'orderId or orderNumber required' });
  if (!etdDate) return res.status(400).json({ success: false, error: 'etdDate required' });

  const etdField = process.env.ETD_FIELD_NAME;
  const apiKey   = process.env.CIN7_API_KEY;
  const apiUser  = process.env.CIN7_API_USERNAME;

  if (!apiKey || !apiUser) {
    return res.status(200).json({ success: false, error: 'Cin7 credentials not configured' });
  }

  if (!etdField) {
    console.log(`[set-etd] ETD_FIELD_NAME not set. Would update order ${orderNumber ?? orderId} to ${etdDate}`);
    return res.status(200).json({ success: true, simulated: true,
      message: 'ETD_FIELD_NAME not configured — set it in Vercel env vars to activate.' });
  }

  try {
    const headers = cin7Headers(apiUser, apiKey);

    // Cin7 Omni PATCH to update a sales order field
    const url = `${CIN7_BASE}/SalesOrders/${orderId ?? orderNumber}`;
    console.log(`[set-etd] PATCH ${url} — ${etdField} = ${etdDate}`);

    const patchRes = await fetch(url, {
      method:  'PUT',
      headers,
      body: JSON.stringify({ [etdField]: etdDate }),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text().catch(() => '');
      throw new Error(`Cin7 Omni API error: ${patchRes.status} — ${errText.slice(0, 300)}`);
    }

    const result = await patchRes.json().catch(() => ({}));
    console.log(`[set-etd] Updated order ${orderNumber ?? orderId} ETD to ${etdDate}`);

    return res.status(200).json({ success: true, orderId, orderNumber, etdDate, etdField, result });

  } catch (err) {
    console.error('[set-etd] Error:', err.message);
    return res.status(200).json({ success: false, error: err.message });
  }
}
