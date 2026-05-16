/**
 * api/cin7-so-probe.cjs
 * ─────────────────────
 * GET /api/cin7-so-probe
 *   ?reference=TOLI9535-1     ← search SalesOrders for a specific reference
 *   ?recent=true              ← (default) fetch 5 most recent open SOs to see field shape
 *
 * READ-ONLY diagnostic. Looks at the Cin7 SalesOrders endpoint to see if a
 * Sales Order's record contains any field pointing back to a Purchase Order
 * (the link Transaction Links suggests in the UI).
 *
 * Specifically hunts for the value "PO-41617" or similar in any field of any
 * returned SO. If found, we can use that field to map POs ↔ SOs.
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

async function fetchSalesOrders(params = {}) {
  const query = new URLSearchParams({ page: '1', rows: '10', ...params }).toString();
  const url = `${CIN7_BASE}/SalesOrders?${query}`;
  const res = await fetch(url, { headers: cin7Headers() });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cin7 SO fetch failed ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.Data ?? []);
}

// Recursively walk an object looking for a target string in any value
function findInObject(obj, target, path = '') {
  const hits = [];
  if (obj === null || obj === undefined) return hits;
  if (typeof obj === 'string') {
    if (obj.includes(target)) hits.push({ path, value: obj });
    return hits;
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    if (String(obj).includes(target)) hits.push({ path, value: obj });
    return hits;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => hits.push(...findInObject(item, target, `${path}[${i}]`)));
    return hits;
  }
  for (const [k, v] of Object.entries(obj)) {
    hits.push(...findInObject(v, target, path ? `${path}.${k}` : k));
  }
  return hits;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });

  const reference = req.query.reference;

  try {
    let salesOrders;
    let searchMode;
    let searchHits = null;

    if (reference) {
      // Try fetching a specific SO by reference
      searchMode = `Searching for SO with reference "${reference}"`;
      salesOrders = await fetchSalesOrders({
        where: `reference='${reference}'`,
        page: '1', rows: '5',
      });
      if (salesOrders.length === 0) {
        // Maybe LIKE search will find it
        salesOrders = await fetchSalesOrders({
          where: `reference LIKE '%${reference}%'`,
          page: '1', rows: '5',
        });
      }
    } else {
      // Default: grab 5 recent SOs and look at their shapes
      searchMode = 'Fetching 5 most recent SOs to inspect field shape';
      salesOrders = await fetchSalesOrders({ page: '1', rows: '5' });
    }

    // Hunt for "PO-41617" anywhere in any returned SO
    const targetPo = 'PO-41617';
    const hitsByPo = {};
    salesOrders.forEach((so, idx) => {
      const ref = so.reference || so.Reference || `(idx ${idx})`;
      const hits = findInObject(so, targetPo);
      if (hits.length > 0) {
        hitsByPo[ref] = hits;
      }
    });

    // Collect all top-level field names across all SOs
    const allKeys = new Set();
    salesOrders.forEach(so => Object.keys(so).forEach(k => allKeys.add(k)));

    // Hunt for any field name that suggests PO linkage
    const suspectPattern = /purchase|sourceOrder|fulfilment|fulfillment|allocation|relatedOrder|linkedOrder|parentOrder/i;
    const suspectFields = {};
    salesOrders.forEach((so, idx) => {
      const ref = so.reference || so.Reference || `(idx ${idx})`;
      for (const [key, value] of Object.entries(so)) {
        if (suspectPattern.test(key) && value !== null && value !== '' && value !== 0) {
          suspectFields[`${ref}.${key}`] = value;
        }
      }
      // Also check line items for PO-linkage fields
      const lines = so.lineItems || so.LineItems || [];
      lines.forEach((li, liIdx) => {
        for (const [key, value] of Object.entries(li)) {
          if (suspectPattern.test(key) && value !== null && value !== '' && value !== 0) {
            suspectFields[`${ref}.lineItems[${liIdx}].${key}`] = value;
          }
        }
      });
    });

    return res.status(200).json({
      ok: true,
      mode: searchMode,
      count: salesOrders.length,
      topLevelFieldsUnion: Array.from(allKeys).sort(),
      lineItemFieldsUnion: Array.from(new Set(
        salesOrders.flatMap(so => (so.lineItems || so.LineItems || []).flatMap(li => Object.keys(li)))
      )).sort(),
      target_PO_41617_hits: Object.keys(hitsByPo).length > 0
        ? hitsByPo
        : '(target PO-41617 NOT found in any field of these SOs)',
      suspectPoLinkageFields: Object.keys(suspectFields).length > 0
        ? suspectFields
        : '(no SO fields matched purchase/source/fulfilment/allocation/linked/parent patterns)',
      firstSalesOrder: salesOrders[0] || null,
      secondSalesOrder: salesOrders[1] || null,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
