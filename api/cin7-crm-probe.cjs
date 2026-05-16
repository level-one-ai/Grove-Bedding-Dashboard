/**
 * api/cin7-crm-probe.cjs
 * ──────────────────────
 * GET /api/cin7-crm-probe?reference=PO-41617
 *   ?max=2000     — how many contacts to scan (default 2000, max 5000)
 *   ?reference    — the string to search for inside every contact field
 *
 * READ-ONLY diagnostic. Fetches Cin7 Contacts (CRM records) and recursively
 * searches every field of every contact for the supplied reference string.
 *
 * Use to test the theory: "Does the CRM hold references to PO numbers?"
 *
 * If a hit is found, we'll see exactly which contact and which field. If no
 * hits, we've ruled out the CRM as a source of PO ↔ SO linkage.
 */

const CIN7_BASE = 'https://api.cin7.com/api/v1';
const PAGE_SIZE = 250;

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

async function fetchContactsPage(page) {
  const url = `${CIN7_BASE}/Contacts?page=${page}&rows=${PAGE_SIZE}`;
  const res = await fetch(url, { headers: cin7Headers() });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cin7 Contacts fetch ${page} failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// Recursively walk an object looking for a target string in any string/number value.
// Returns list of { path, value } matches.
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

  const reference = req.query.reference || 'PO-41617';
  const max = Math.min(parseInt(req.query.max || '2000', 10), 5000);
  const maxPages = Math.ceil(max / PAGE_SIZE);

  const startTime = Date.now();

  try {
    const allContacts = [];
    let pagesFetched = 0;

    for (let p = 1; p <= maxPages; p++) {
      const batch = await fetchContactsPage(p);
      pagesFetched++;
      if (batch.length === 0) break;
      allContacts.push(...batch);
      if (batch.length < PAGE_SIZE) break; // last page
      if (allContacts.length >= max) break;
    }

    // Search every contact for the reference
    const matches = [];
    for (const contact of allContacts) {
      const hits = findInObject(contact, reference);
      if (hits.length > 0) {
        matches.push({
          contactId: contact.id || contact.Id,
          contactName: [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim()
            || contact.company
            || '(no name)',
          contactCompany: contact.company || null,
          fieldsContaining_ref: hits,
        });
      }
    }

    // Also collect a list of every top-level field name seen on contacts
    // (helps us understand what shape Contacts have)
    const allKeys = new Set();
    allContacts.forEach(c => Object.keys(c || {}).forEach(k => allKeys.add(k)));

    return res.status(200).json({
      ok: true,
      durationMs: Date.now() - startTime,
      searchedFor: reference,
      contactsScanned: allContacts.length,
      pagesFetched,
      matchCount: matches.length,
      matches: matches.length > 0
        ? matches
        : `(no contacts contained "${reference}" in any field)`,
      contactFieldsObserved: Array.from(allKeys).sort(),
      firstContactShape: allContacts[0] || null,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
};
