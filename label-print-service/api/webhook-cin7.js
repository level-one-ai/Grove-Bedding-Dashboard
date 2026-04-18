/**
 * label-print-service/api/webhook-cin7.js
 * ─────────────────────────────────────────
 * Vercel serverless function — POST /api/webhook-cin7
 *
 * Current behaviour (ETD discovery mode):
 *   1. Receive any webhook from Cin7 Omni
 *   2. Validate the request
 *   3. Fetch the full order from Cin7 REST API
 *   4. Log EVERY field from the order response to Firestore
 *      so you can inspect them and identify the exact ETD field name
 *   5. Scan known ETD-related field names automatically
 *   6. If an ETD field is found with a value → queue a print job
 *   7. If no ETD field is found yet → log as "discovery" run (no print)
 *
 * Once you identify the exact field name, set ETD_FIELD_NAME in
 * Vercel environment variables and the system will use it directly.
 *
 * Environment variables (set in Vercel → Project → Settings → Env Vars):
 *
 *   CIN7_API_KEY          Cin7 Omni API key
 *   CIN7_API_USERNAME     Cin7 Omni API username / account name
 *   CIN7_BASE_URL         https://inventory.dearsystems.com/ExternalApi/v2
 *   WEBHOOK_SECRET        A secret string — set the same value in Cin7 webhook header
 *   FIREBASE_PROJECT_ID   grove-label-print  (your new project)
 *   FIREBASE_CLIENT_EMAIL service account email from Firebase JSON
 *   FIREBASE_PRIVATE_KEY  private_key from Firebase JSON (keep the \n characters)
 *   ETD_FIELD_NAME        (optional) once discovered, set the exact field name here
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue }      from 'firebase-admin/firestore';
import { buildDymoXml }                  from '../templates/dymo-template.js';

// ─── Known ETD-related field names to probe ──────────────────────────────────
// Cin7 Omni uses different field names depending on plan and configuration.
// We check all of these automatically and log which one has a value.
const ETD_CANDIDATE_FIELDS = [
  // Standard Cin7 / DEAR Systems fields
  'ETD',
  'Etd',
  'ShipByDate',
  'RequiredDate',
  'PromisedDate',
  'EstimatedDeliveryDate',
  'DeliveryDate',
  'ExpectedDeliveryDate',
  'ShipDate',
  'DueDate',
  'DispatchDate',
  'PlannedShipDate',
  'PlannedDeliveryDate',
  'ETA',
  'Eta',
  // Custom / AdditionalAttributes variants
  'ETDDate',
  'EtdDate',
  'etd',
  'etd_date',
  'CustomETD',
];

// ─── Firebase Admin (singleton) ──────────────────────────────────────────────
function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   process.env.LABEL_FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.LABEL_FIREBASE_CLIENT_EMAIL ?? process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.LABEL_FIREBASE_PRIVATE_KEY ?? process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

// ─── Cin7 API helpers ────────────────────────────────────────────────────────
function cin7Headers() {
  const creds = Buffer.from(
    `${process.env.CIN7_API_USERNAME}:${process.env.CIN7_API_KEY}`
  ).toString('base64');
  return { Authorization: `Basic ${creds}`, 'Content-Type': 'application/json' };
}

async function fetchCin7Order(orderId) {
  const base = process.env.CIN7_BASE_URL;
  const res  = await fetch(`${base}/sale?ID=${orderId}`, { headers: cin7Headers() });
  if (!res.ok) throw new Error(`Cin7 /sale fetch failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.SaleList?.[0] ?? data;
}

// Fetch EVERY available endpoint for this order and merge all fields —
// gives us the widest possible field discovery surface.
async function fetchAllCin7Fields(orderId, orderRef) {
  const base     = process.env.CIN7_BASE_URL;
  const headers  = cin7Headers();
  const results  = {};

  const endpoints = [
    { key: 'sale',              url: `${base}/sale?ID=${orderId}` },
    { key: 'sale_by_ref',       url: `${base}/sale?SaleOrderNumber=${orderRef}` },
    { key: 'saleOrder',         url: `${base}/saleOrder?ID=${orderId}` },
    { key: 'saleFulfillment',   url: `${base}/saleFulfillment?SaleID=${orderId}` },
    { key: 'saleInvoice',       url: `${base}/saleInvoice?SaleID=${orderId}` },
    { key: 'saleShipment',      url: `${base}/saleShipment?SaleID=${orderId}` },
  ];

  for (const ep of endpoints) {
    try {
      const r = await fetch(ep.url, { headers });
      if (r.ok) {
        const json = await r.json();
        // Flatten list responses to just the first item
        const item = Array.isArray(json) ? json[0]
          : (json.SaleList?.[0] ?? json.SaleOrderList?.[0] ?? json);
        results[ep.key] = item ?? null;
      } else {
        results[ep.key] = { _error: `${r.status} ${r.statusText}` };
      }
    } catch (e) {
      results[ep.key] = { _error: e.message };
    }
  }

  return results;
}

// ─── ETD detection ───────────────────────────────────────────────────────────
function findEtdField(order, allFields) {
  // Priority 1: user has set the exact field name in env
  if (process.env.ETD_FIELD_NAME) {
    const val = deepGet(order, process.env.ETD_FIELD_NAME)
             ?? deepGet(order.AdditionalAttributes, process.env.ETD_FIELD_NAME);
    if (val) return { fieldName: process.env.ETD_FIELD_NAME, value: val, source: 'env_override' };
  }

  // Priority 2: scan top-level order fields
  for (const field of ETD_CANDIDATE_FIELDS) {
    if (order[field] !== undefined && order[field] !== null && order[field] !== '') {
      return { fieldName: field, value: order[field], source: 'top_level' };
    }
  }

  // Priority 3: scan AdditionalAttributes (custom fields)
  const custom = order.AdditionalAttributes ?? {};
  for (const field of ETD_CANDIDATE_FIELDS) {
    if (custom[field] !== undefined && custom[field] !== null && custom[field] !== '') {
      return { fieldName: `AdditionalAttributes.${field}`, value: custom[field], source: 'custom_fields' };
    }
  }

  // Priority 4: scan all endpoint responses
  for (const [endpoint, data] of Object.entries(allFields)) {
    if (!data || data._error) continue;
    for (const field of ETD_CANDIDATE_FIELDS) {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        return { fieldName: field, value: data[field], source: endpoint };
      }
    }
  }

  return null; // not found yet
}

function deepGet(obj, key) {
  if (!obj || typeof obj !== 'object') return undefined;
  if (key in obj) return obj[key];
  for (const v of Object.values(obj)) {
    if (typeof v === 'object') {
      const found = deepGet(v, key);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

// ─── Extract all date-like fields from an object (helps discovery) ──────────
function extractDateFields(obj, prefix = '') {
  const dates = {};
  if (!obj || typeof obj !== 'object') return dates;
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string' && /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/.test(v)) {
      dates[fullKey] = v;
    } else if (typeof v === 'object' && v !== null) {
      Object.assign(dates, extractDateFields(v, fullKey));
    }
  }
  return dates;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const runId  = `RUN-${Date.now()}`;
  const db     = getDb();
  const logRef = db.collection('labelRuns').doc(runId);
  const steps  = [];
  const addStep = (step, status, detail) =>
    steps.push({ step, status, detail, ts: new Date().toISOString() });

  try {
    // ── 1. Receive & validate ────────────────────────────────────────────
    const payload = req.body ?? {};

    // Log the raw webhook payload immediately — useful for discovery
    await db.collection('webhookPayloads').doc(runId).set({
      runId,
      rawPayload: JSON.stringify(payload),
      receivedAt: FieldValue.serverTimestamp(),
    });

    // Validate secret
    const secret = req.headers['x-webhook-secret'];
    if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
      addStep('auth', 'error', 'Invalid webhook secret');
      await logRef.set({ runId, status: 'failed', steps, createdAt: FieldValue.serverTimestamp() });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract order ID — Cin7 webhooks use various key names
    const orderId = payload.ID ?? payload.SaleID ?? payload.OrderID
                 ?? payload.id ?? payload.saleId ?? payload.orderId;

    if (!orderId) {
      addStep('validate', 'error', `No order ID found in payload. Keys received: ${Object.keys(payload).join(', ')}`);
      await logRef.set({ runId, status: 'failed', steps, rawPayload: payload, createdAt: FieldValue.serverTimestamp() });
      return res.status(400).json({ error: 'No order ID in payload', keysReceived: Object.keys(payload) });
    }

    addStep('webhook', 'success', `Webhook received — order ID: ${orderId}`);

    // ── 2. Fetch full order + all endpoints ──────────────────────────────
    const order = await fetchCin7Order(orderId);
    addStep('fetch', 'success', `Order ${order.SaleOrderNumber ?? orderId} fetched from Cin7`);

    // Fetch all endpoints for maximum field coverage
    const allEndpointData = await fetchAllCin7Fields(orderId, order.SaleOrderNumber);

    // Extract all date-like fields across everything we received
    const allDateFields = {
      ...extractDateFields(order, 'sale'),
      ...Object.entries(allEndpointData).reduce((acc, [ep, data]) => ({
        ...acc,
        ...extractDateFields(data, ep),
      }), {}),
    };

    addStep('discovery', 'success',
      `Field scan complete — ${Object.keys(allDateFields).length} date fields found across all endpoints`
    );

    // ── 3. Store full field map in Firestore for inspection ──────────────
    await db.collection('cin7FieldDiscovery').doc(runId).set({
      runId,
      orderId,
      orderRef:      order.SaleOrderNumber ?? null,
      scannedAt:     FieldValue.serverTimestamp(),

      // The full order object — every field Cin7 returned
      fullOrderData: JSON.stringify(order),

      // All endpoint responses
      allEndpoints:  JSON.stringify(allEndpointData),

      // All date-like fields extracted (most useful for finding ETD)
      allDateFields,

      // AdditionalAttributes / custom fields specifically
      customFields:  order.AdditionalAttributes ?? {},

      // Which ETD candidates had values
      etdCandidatesFound: ETD_CANDIDATE_FIELDS.reduce((acc, f) => {
        const val = order[f] ?? order.AdditionalAttributes?.[f];
        if (val) acc[f] = val;
        return acc;
      }, {}),
    });

    // ── 4. Detect ETD field ──────────────────────────────────────────────
    const etdResult = findEtdField(order, allEndpointData);

    if (!etdResult) {
      addStep('etd_check', 'skipped',
        `No ETD field detected yet. Check Firestore → cin7FieldDiscovery → ${runId} to see all fields.`
      );
      await logRef.set({
        runId, orderId,
        orderRef:   order.SaleOrderNumber ?? null,
        status:     'discovery',
        message:    'ETD field not yet identified — field map saved to cin7FieldDiscovery',
        steps,
        createdAt:  FieldValue.serverTimestamp(),
      });
      return res.status(200).json({
        message:    'Webhook received — ETD field not yet identified',
        action:     'Check Firestore cin7FieldDiscovery collection to inspect all available fields',
        runId,
        dateFieldsFound: allDateFields,
      });
    }

    addStep('etd_check', 'success',
      `ETD field found: "${etdResult.fieldName}" = "${etdResult.value}" (source: ${etdResult.source})`
    );

    // ── 5. Build label data ───────────────────────────────────────────────
    const lineItem   = order.SaleOrderLines?.[0] ?? {};
    const labelData  = {
      orderRef:     order.SaleOrderNumber ?? order.Reference ?? String(orderId),
      customerName: `${order.ShipFirstName ?? ''}, ${order.ShipLastName ?? ''}`.trim(),
      productName:  `${lineItem.Name ?? ''} - ${lineItem.Option ?? ''}`.trim(),
      productSize:  lineItem.Option ?? '',
      address:      [
        order.ShipStreetLine1,
        order.ShipCity,
        order.ShipStateText ?? order.ShipState,
        order.ShipCountry,
        order.ShipPostCode,
      ].filter(Boolean).join(', '),
      deliveryDate:  formatDate(etdResult.value),
      packageCount:  '1/1',
      website:       'www.grovebedding.com',
    };

    // ── 6. Build DYMO XML ─────────────────────────────────────────────────
    const dymoXml = buildDymoXml(labelData);
    addStep('template', 'success', 'Label fields merged into DYMO XML template');

    // ── 7. Queue print job ────────────────────────────────────────────────
    await db.collection('printQueue').doc(runId).set({
      runId,
      status:    'queued',
      labelData,
      dymoXml,
      orderId,
      orderRef:  order.SaleOrderNumber,
      etdField:  etdResult.fieldName,
      etdValue:  etdResult.value,
      createdAt: FieldValue.serverTimestamp(),
      attempts:  0,
    });

    addStep('queue', 'success', `Print job ${runId} queued — bridge agent will pick it up`);

    // ── 8. Final log ──────────────────────────────────────────────────────
    await logRef.set({
      runId,
      orderId,
      orderRef:  order.SaleOrderNumber,
      customer:  labelData.customerName,
      product:   labelData.productName,
      address:   labelData.address,
      etdField:  etdResult.fieldName,
      etdValue:  etdResult.value,
      status:    'queued',
      steps,
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ message: 'Print job queued', runId, etdField: etdResult.fieldName });

  } catch (err) {
    console.error('[webhook-cin7]', err);
    addStep('error', 'error', err.message);
    await logRef.set({
      runId, status: 'failed', error: err.message, steps,
      createdAt: FieldValue.serverTimestamp(),
    }).catch(() => {});
    return res.status(500).json({ error: 'Internal server error', detail: err.message, runId });
  }
}

// ─── Date formatter ──────────────────────────────────────────────────────────
function formatDate(raw) {
  if (!raw) return '';
  try {
    return new Date(raw).toLocaleDateString('en-GB');
  } catch {
    return String(raw);
  }
}
