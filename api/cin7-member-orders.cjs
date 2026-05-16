/**
 * api/cin7-member-orders.cjs
 * ──────────────────────────
 * GET /api/cin7-member-orders?memberId=<id>&type=po
 *   type=po  → list Purchase Orders where the supplier matches this memberId
 *   type=so  → list Sales Orders where the customer matches this memberId
 *
 * READ-ONLY diagnostic for exploring all orders linked to a specific member
 * (supplier or customer).
 */

const CIN7_BASE = 'https://api.cin7.com/api/v1';

function cin7Headers() {
  const user = process.env.CIN7_API_USERNAME;
  const key  = process.env.CIN7_API_KEY;
  if (!user || !key) throw new Error('Missing CIN7_API_USERNAME or CIN7_API_KEY');
  const creds = Buffer.from(`${user}:${key}`).toString('base64');
  return {
    'Authorization': `Basic ${creds}`,
    'Content-Type':  'application/json',
    'Accept':        'application/json',
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });

  const memberId = req.query.memberId;
  const type     = (req.query.type || 'po').toLowerCase();
  const max      = Math.min(parseInt(req.query.max || '50', 10), 250);

  if (!memberId) {
    return res.status(400).json({
      error: 'Provide ?memberId=<id>&type=po (or type=so)',
    });
  }

  try {
    const endpoint = type === 'so' ? 'SalesOrders' : 'PurchaseOrders';
    const where = `memberId=${memberId}`;
    const url = `${CIN7_BASE}/${endpoint}?where=${encodeURIComponent(where)}&page=1&rows=${max}&order=createdDate%20DESC`;

    const resp = await fetch(url, { headers: cin7Headers() });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Cin7 ${endpoint} fetch failed: ${resp.status} ${text.slice(0, 200)}`);
    }

    const orders = await resp.json();
    const orderList = Array.isArray(orders) ? orders : [];

    // Summarise — show just the key fields so output stays readable
    const summary = orderList.map(o => ({
      id:                o.id,
      reference:         o.reference,
      createdDate:       o.createdDate,
      modifiedDate:      o.modifiedDate,
      status:            o.status,
      stage:             o.stage,
      company:           o.company,
      firstName:         o.firstName,
      lastName:          o.lastName,
      productTotal:      o.productTotal,
      total:             o.total,
      estimatedDeliveryDate: o.estimatedDeliveryDate,
      fullyReceivedDate: o.fullyReceivedDate,
      lineItemCount:     Array.isArray(o.lineItems) ? o.lineItems.length : 0,
      lineItemProducts:  Array.isArray(o.lineItems)
        ? o.lineItems.map(li => `${li.qty}× ${li.name || li.code}`).slice(0, 5)
        : [],
    }));

    return res.status(200).json({
      ok: true,
      memberId,
      type,
      endpoint,
      count: orderList.length,
      orders: summary,
      // Include first full record for field inspection
      firstFullRecord: orderList[0] || null,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
