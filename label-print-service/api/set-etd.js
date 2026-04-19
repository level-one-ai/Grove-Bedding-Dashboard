/**
 * label-print-service/api/set-etd.js
 * ─────────────────────────────────────
 * POST /api/set-etd
 *
 * Updates the ETD (Estimated Time of Delivery) date on a Cin7 sales order.
 * Uses the ETD_FIELD_NAME environment variable to know which field to update.
 *
 * Body: { orderId, orderNumber, etdDate }  (etdDate is ISO string e.g. "2026-06-15")
 *
 * Environment variables required:
 *   CIN7_API_KEY
 *   CIN7_API_USERNAME
 *   CIN7_BASE_URL
 *   ETD_FIELD_NAME  — the exact field name in Cin7 to update
 */

function cin7Headers() {
  return {
    'api-auth-accountid':      process.env.CIN7_API_USERNAME ?? '',
    'api-auth-applicationkey': process.env.CIN7_API_KEY ?? '',
    'Content-Type': 'application/json',
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const { orderId, orderNumber, etdDate } = body ?? {};

  if (!orderId && !orderNumber) {
    return res.status(400).json({ success: false, error: 'orderId or orderNumber required' });
  }
  if (!etdDate) {
    return res.status(400).json({ success: false, error: 'etdDate required' });
  }

  const etdField = process.env.ETD_FIELD_NAME;
  const apiKey   = process.env.CIN7_API_KEY;
  const apiUser  = process.env.CIN7_API_USERNAME;
  const base     = process.env.CIN7_BASE_URL ?? 'https://inventory.dearsystems.com/ExternalApi/v2';

  if (!apiKey || !apiUser) {
    return res.status(200).json({ success: false, error: 'Cin7 credentials not configured in Vercel env vars' });
  }

  if (!etdField) {
    // ETD field not yet confirmed — log the intent but do not fail
    console.log(`[set-etd] ETD_FIELD_NAME not set. Would update order ${orderNumber ?? orderId} ETD to ${etdDate}`);
    return res.status(200).json({
      success: true,
      simulated: true,
      message: `ETD_FIELD_NAME not configured yet. Set it in Vercel env vars once confirmed. Would have set ${etdDate} on order ${orderNumber ?? orderId}.`,
    });
  }

  try {
    // First fetch the current order to get its full data (required for PUT)
    const getUrl = orderId
      ? `${base}/sale?ID=${encodeURIComponent(orderId)}`
      : `${base}/sale?OrderNumber=${encodeURIComponent(orderNumber)}`;

    console.log(`[set-etd] Fetching order: ${getUrl}`);
    const getRes = await fetch(getUrl, { headers: cin7Headers() });

    if (!getRes.ok) {
      throw new Error(`Failed to fetch order: ${getRes.status} ${getRes.statusText}`);
    }

    const getData = await getRes.json();
    const order   = getData?.Sale ?? getData?.SaleList?.[0] ?? getData;

    if (!order?.ID) {
      throw new Error(`Order not found: ${orderNumber ?? orderId}`);
    }

    // Update the ETD field
    const updatePayload = {
      ...order,
      [etdField]: etdDate,
    };

    console.log(`[set-etd] Updating order ${order.OrderNumber} field "${etdField}" to "${etdDate}"`);

    const putRes = await fetch(`${base}/sale`, {
      method: 'PUT',
      headers: cin7Headers(),
      body: JSON.stringify(updatePayload),
    });

    if (!putRes.ok) {
      const errText = await putRes.text().catch(() => '');
      throw new Error(`Cin7 update failed: ${putRes.status} ${putRes.statusText} — ${errText.slice(0, 200)}`);
    }

    const putData = await putRes.json();

    console.log(`[set-etd] ✓ Updated order ${order.OrderNumber} ETD to ${etdDate}`);

    return res.status(200).json({
      success: true,
      orderId:     order.ID,
      orderNumber: order.OrderNumber,
      etdField,
      etdDate,
      message: `ETD updated to ${new Date(etdDate).toLocaleDateString('en-GB')} on order ${order.OrderNumber}`,
    });

  } catch (err) {
    console.error('[set-etd] Error:', err.message);
    return res.status(200).json({
      success: false,
      error: err.message,
    });
  }
}
