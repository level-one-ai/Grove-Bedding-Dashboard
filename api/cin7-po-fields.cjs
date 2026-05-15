/**
 * api/cin7-po-fields.cjs
 * ──────────────────────
 * GET /api/cin7-po-fields?id=41573
 *
 * READ-ONLY diagnostic. Fetches a single Purchase Order from Cin7 Omni and
 * dumps every field unedited, so we can see:
 *   - Every top-level field name + value
 *   - Every line item with all its fields
 *   - Specifically: what field exposes the "Transaction Links" data
 *   - Whether fullyReceivedDate is populated on this PO
 *
 * This file lives in the dashboard repo's /api/ folder. It's a one-off
 * inspection tool — once we know the Transaction Links field shape, we'll
 * use it to build the real auto-print logic.
 *
 * Uses the same CIN7_API_USERNAME / CIN7_API_KEY env vars the existing
 * label-print-service files use — no new env vars required.
 */

const CIN7_BASE = 'https://api.cin7.com/api/v1';

function cin7Headers() {
  const user = process.env.CIN7_API_USERNAME;
  const key  = process.env.CIN7_API_KEY;
  if (!user || !key) {
    throw new Error('Missing CIN7_API_USERNAME or CIN7_API_KEY env var');
  }
  const credentials = Buffer.from(`${user}:${key}`).toString('base64');
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type':  'application/json',
    'Accept':        'application/json',
  };
}

async function fetchPurchaseOrderById(id) {
  // Try direct path-based lookup first (matches the existing webhook-cin7 pattern)
  const url = `${CIN7_BASE}/PurchaseOrders?where=${encodeURIComponent(`id=${id}`)}&page=1&rows=1`;
  const res = await fetch(url, { headers: cin7Headers() });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cin7 PO lookup ${id} failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const arr = Array.isArray(data) ? data : (data?.Data ?? [data]);
  return arr[0] || null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });

  const id = req.query.id;
  if (!id) {
    return res.status(400).json({
      error: 'Provide ?id=<PO id>. Example: /api/cin7-po-fields?id=41573',
    });
  }

  try {
    const po = await fetchPurchaseOrderById(id);
    if (!po) {
      return res.status(404).json({ ok: false, error: `PO ${id} not found` });
    }

    // Top-level field names
    const topLevelKeys = Object.keys(po).sort();

    // Line item field names (union across all line items)
    const lineItems = po.lineItems || po.LineItems || [];
    const lineItemKeys = new Set();
    lineItems.forEach(li => Object.keys(li).forEach(k => lineItemKeys.add(k)));

    // Hunt for any field that hints at Sales Order linkage
    const suspectFields = {};
    const patterns = /sale|allocate|link|transaction|reference|fulfil|fulfill|customer|reserve|commit/i;
    for (const [key, value] of Object.entries(po)) {
      if (patterns.test(key)) suspectFields[`po.${key}`] = value;
    }
    lineItems.forEach((li, idx) => {
      for (const [key, value] of Object.entries(li)) {
        if (patterns.test(key) && value !== null && value !== '' && value !== 0) {
          suspectFields[`lineItems[${idx}].${key}`] = value;
        }
      }
    });

    return res.status(200).json({
      ok: true,
      poId: id,
      reference: po.reference || po.Reference,
      status:    po.status    || po.Status,
      stage:     po.stage     || po.Stage,
      fullyReceivedDate: po.fullyReceivedDate ?? null,
      fullyReceivedDate_isPopulated: !!po.fullyReceivedDate,

      topLevelFieldCount: topLevelKeys.length,
      topLevelKeys,

      lineItemCount: lineItems.length,
      lineItemKeys:  Array.from(lineItemKeys).sort(),

      suspectFields: Object.keys(suspectFields).length > 0
        ? suspectFields
        : '(no fields matched sale/allocate/link/transaction/reference/fulfil/customer/reserve/commit)',

      lineItemsFullDump: lineItems,
      poRecord_minus_lineItems: Object.fromEntries(
        Object.entries(po).filter(([k]) => k !== 'lineItems' && k !== 'LineItems')
      ),
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
};
