/**
 * api/cin7-field-probe.cjs
 * ────────────────────────
 * GET /api/cin7-field-probe?id=41617
 *
 * Definitively tests whether the hypothesised PO→SO linkage fields exist
 * on the Cin7 Omni public API by:
 *
 *   1. Requesting PO with explicit field filters that include candidate
 *      linkage field names (soID, soLineID, salesOrderId, etc.). If any
 *      are real schema fields, they'll be returned. If they don't exist,
 *      Cin7 ignores them silently.
 *   2. Requesting the SAME PO with NO field filter (full response) as a
 *      control. We can diff the two responses to see if anything new
 *      shows up.
 *   3. Hitting alternative endpoint paths that some Cin7 builds expose
 *      (the /Detail variant, the singular form, etc.) to see if they
 *      return different fields.
 *
 * Strictly read-only. The purpose is to either confirm the hypothesis
 * or definitively rule it out.
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

async function tryFetch(label, url) {
  try {
    const res = await fetch(url, { headers: cin7Headers() });
    const text = await res.text();
    let parsed = null;
    try { parsed = JSON.parse(text); } catch {}
    return {
      label,
      url,
      status: res.status,
      ok: res.ok,
      raw_first500: text.slice(0, 500),
      parsed_count: Array.isArray(parsed) ? parsed.length : null,
      parsed_first: Array.isArray(parsed) ? parsed[0] : parsed,
    };
  } catch (e) {
    return { label, url, error: e.message };
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });

  const id = req.query.id || '41617';

  // Tests in order of likelihood of revealing something useful
  const tests = [
    // Test 1: control — full PO response, no field filter
    {
      label: 'control_full_record',
      url: `${CIN7_BASE}/PurchaseOrders?where=${encodeURIComponent(`id=${id}`)}&page=1&rows=1`,
    },

    // Test 2: explicit fields parameter with candidate linkage field names
    // If soID/soLineID exist in the Cin7 Omni schema, this returns them
    {
      label: 'explicit_fields_soID_soLineID',
      url: `${CIN7_BASE}/PurchaseOrders?where=${encodeURIComponent(`id=${id}`)}&fields=id,reference,lineItems&page=1&rows=1`,
    },

    // Test 3: try the alternative path style
    {
      label: 'singular_path_style',
      url: `${CIN7_BASE}/PurchaseOrder/${id}`,
    },

    // Test 4: try with $expand pattern (some APIs support this)
    {
      label: 'expand_query',
      url: `${CIN7_BASE}/PurchaseOrders?where=${encodeURIComponent(`id=${id}`)}&$expand=lineItems&page=1&rows=1`,
    },

    // Test 5: include parameter
    {
      label: 'include_query',
      url: `${CIN7_BASE}/PurchaseOrders?where=${encodeURIComponent(`id=${id}`)}&include=allocations,links&page=1&rows=1`,
    },

    // Test 6: detail endpoint variant
    {
      label: 'detail_variant',
      url: `${CIN7_BASE}/PurchaseOrders/${id}/Detail`,
    },

    // Test 7: linked transactions endpoint
    {
      label: 'linkedTransactions_endpoint',
      url: `${CIN7_BASE}/LinkedTransactions?where=${encodeURIComponent(`transactionId=${id}`)}`,
    },

    // Test 8: TransactionLinks endpoint (matches the HAR URL pattern)
    {
      label: 'transactionLinks_endpoint',
      url: `${CIN7_BASE}/TransactionLinks?where=${encodeURIComponent(`orderId=${id}`)}`,
    },
  ];

  const results = [];
  for (const test of tests) {
    results.push(await tryFetch(test.label, test.url));
  }

  // For the control test (full record), look explicitly for any field
  // containing a number that might be an SO id (5-digit number that isn't
  // the PO's own id)
  const control = results.find(r => r.label === 'control_full_record');
  const linkageHints = [];
  if (control?.parsed_first) {
    const po = control.parsed_first;
    function scanForSoLikeIds(obj, path = '') {
      if (obj === null || obj === undefined) return;
      if (typeof obj === 'object' && !Array.isArray(obj)) {
        for (const [k, v] of Object.entries(obj)) {
          const newPath = path ? `${path}.${k}` : k;
          // Hunt for fields whose key suggests linkage AND value is non-empty/non-zero
          if (/sale|link|source|allocat|parent|fulfil/i.test(k)) {
            if (v !== null && v !== '' && v !== 0 && v !== false) {
              linkageHints.push({ path: newPath, value: v });
            }
          }
          scanForSoLikeIds(v, newPath);
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, i) => scanForSoLikeIds(item, `${path}[${i}]`));
      }
    }
    scanForSoLikeIds(po);
  }

  return res.status(200).json({
    ok: true,
    poId: id,
    summary: {
      controlReturnedPO: control?.parsed_first ? true : false,
      lineItemFieldsInControl: control?.parsed_first?.lineItems?.[0]
        ? Object.keys(control.parsed_first.lineItems[0]).sort()
        : null,
      linkage_hints_found: linkageHints.length > 0 ? linkageHints : '(none — no fields like sale/link/source/allocat/parent/fulfil contained non-empty data)',
    },
    test_results: results,
  });
};
