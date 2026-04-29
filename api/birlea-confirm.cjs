/**
 * /api/birlea-confirm
 *
 * Make.com calls this endpoint AFTER successfully sending the Birlea order email.
 * The dashboard polls this endpoint to know when step 5 (Confirmed) should go green.
 *
 * Make.com Webhook Response module should POST:
 * {
 *   "confirmed": true,
 *   "orderRef": "BIR-123456",
 *   "status": "sent",
 *   "sentTo": "orders@birlea.com",
 *   "timestamp": "2026-04-24T12:00:00.000Z"
 * }
 *
 * The dashboard polls GET /api/birlea-confirm?ref=BIR-123456
 * and gets back { confirmed: true } once Make.com has confirmed.
 */

// In-memory store of confirmed orders (resets on cold start — fine for this use case)
// Key: orderRef, Value: { confirmed, sentTo, timestamp }
const confirmed = {};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST — Make.com confirms the order was sent
  if (req.method === 'POST') {
    const { orderRef, confirmed: isConfirmed, status, sentTo, timestamp } = req.body || {};

    if (!orderRef) {
      return res.status(400).json({ error: 'orderRef is required' });
    }

    confirmed[orderRef] = {
      confirmed: isConfirmed !== false,  // default true if not specified
      status:    status    || 'sent',
      sentTo:    sentTo    || null,
      timestamp: timestamp || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    };

    console.log(`[birlea-confirm] Order ${orderRef} confirmed — sent to ${sentTo}`);
    return res.status(200).json({ ok: true, orderRef });
  }

  // GET — dashboard polls for confirmation
  if (req.method === 'GET') {
    const { ref: orderRef } = req.query;

    if (!orderRef) {
      return res.status(400).json({ error: 'ref query param required' });
    }

    const record = confirmed[orderRef];
    if (record && record.confirmed) {
      return res.status(200).json({
        confirmed: true,
        orderRef,
        sentTo:    record.sentTo,
        timestamp: record.timestamp,
      });
    }

    return res.status(200).json({ confirmed: false, orderRef });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
