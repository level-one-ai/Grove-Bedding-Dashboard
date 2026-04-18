/**
 * label-print-service/api/discover-fields.js
 * ────────────────────────────────────────────
 * Vercel serverless function — GET /api/discover-fields?orderId=XXXX
 *
 * Use this to manually inspect every field Cin7 returns for a given order.
 * This is safe to call at any time — it never triggers a print job.
 *
 * Usage:
 *   GET https://your-vercel-domain.vercel.app/api/discover-fields?orderId=12345
 *   GET https://your-vercel-domain.vercel.app/api/discover-fields?orderRef=5775-SH
 *
 * Returns a JSON object with:
 *   - allFields:        Every field from every Cin7 endpoint for this order
 *   - dateFields:       Only the fields that look like dates (most relevant for ETD)
 *   - etdCandidates:   Which known ETD field names had a value
 *   - customFields:     The AdditionalAttributes / custom fields section
 *   - recommendation:  Our best guess at the ETD field name
 *
 * Protected by the same WEBHOOK_SECRET header as the main webhook.
 * Add header: x-webhook-secret: your-secret-value
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue }      from 'firebase-admin/firestore';

const ETD_CANDIDATE_FIELDS = [
  'ETD', 'Etd', 'ShipByDate', 'RequiredDate', 'PromisedDate',
  'EstimatedDeliveryDate', 'DeliveryDate', 'ExpectedDeliveryDate',
  'ShipDate', 'DueDate', 'DispatchDate', 'PlannedShipDate',
  'PlannedDeliveryDate', 'ETA', 'Eta', 'ETDDate', 'EtdDate',
  'etd', 'etd_date', 'CustomETD',
];

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

function cin7Headers() {
  const creds = Buffer.from(
    `${process.env.CIN7_API_USERNAME}:${process.env.CIN7_API_KEY}`
  ).toString('base64');
  return { Authorization: `Basic ${creds}`, 'Content-Type': 'application/json' };
}

function extractDateFields(obj, prefix = '') {
  const dates = {};
  if (!obj || typeof obj !== 'object') return dates;
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string' && /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/.test(v)) {
      dates[fullKey] = v;
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      Object.assign(dates, extractDateFields(v, fullKey));
    }
  }
  return dates;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed — use GET' });
  }

  // Auth check
  const secret = req.headers['x-webhook-secret'];
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized — add header: x-webhook-secret' });
  }

  const { orderId, orderRef } = req.query;
  if (!orderId && !orderRef) {
    return res.status(400).json({
      error: 'Provide either ?orderId=XXX or ?orderRef=XXX',
      example: '/api/discover-fields?orderId=12345',
    });
  }

  const base    = process.env.CIN7_BASE_URL;
  const headers = cin7Headers();

  try {
    // Build lookup URL
    const lookupUrl = orderId
      ? `${base}/sale?ID=${orderId}`
      : `${base}/sale?SaleOrderNumber=${orderRef}`;

    const primaryRes  = await fetch(lookupUrl, { headers });
    if (!primaryRes.ok) {
      return res.status(502).json({
        error: `Cin7 API error: ${primaryRes.status} ${primaryRes.statusText}`,
        hint: 'Check your CIN7_API_KEY, CIN7_API_USERNAME and CIN7_BASE_URL env vars',
      });
    }

    const primaryData = await primaryRes.json();
    const order       = primaryData.SaleList?.[0] ?? primaryData;
    const resolvedId  = order.ID ?? order.SaleID ?? orderId;
    const resolvedRef = order.SaleOrderNumber ?? orderRef;

    // Fetch all endpoints
    const endpoints = [
      { key: 'sale',            url: `${base}/sale?ID=${resolvedId}` },
      { key: 'saleOrder',       url: `${base}/saleOrder?ID=${resolvedId}` },
      { key: 'saleFulfillment', url: `${base}/saleFulfillment?SaleID=${resolvedId}` },
      { key: 'saleInvoice',     url: `${base}/saleInvoice?SaleID=${resolvedId}` },
      { key: 'saleShipment',    url: `${base}/saleShipment?SaleID=${resolvedId}` },
    ];

    const allEndpoints = {};
    for (const ep of endpoints) {
      try {
        const r    = await fetch(ep.url, { headers });
        const json = await r.json();
        allEndpoints[ep.key] = r.ok
          ? (Array.isArray(json) ? json[0] : (json.SaleList?.[0] ?? json.SaleOrderList?.[0] ?? json))
          : { _error: `${r.status} ${r.statusText}` };
      } catch (e) {
        allEndpoints[ep.key] = { _error: e.message };
      }
    }

    // Find all date fields
    const dateFields = {
      ...extractDateFields(order, 'sale'),
      ...Object.entries(allEndpoints).reduce((acc, [ep, data]) => ({
        ...acc,
        ...extractDateFields(data, ep),
      }), {}),
    };

    // Find ETD candidates
    const etdCandidates = {};
    for (const field of ETD_CANDIDATE_FIELDS) {
      const val = order[field] ?? order.AdditionalAttributes?.[field];
      if (val !== undefined && val !== null && val !== '') {
        etdCandidates[field] = { value: val, source: order[field] ? 'top_level' : 'AdditionalAttributes' };
      }
    }

    // Best recommendation
    let recommendation = null;
    if (Object.keys(etdCandidates).length > 0) {
      const bestField = Object.keys(etdCandidates)[0];
      recommendation = {
        fieldName: bestField,
        value: etdCandidates[bestField].value,
        action: `Set ETD_FIELD_NAME=${bestField} in your Vercel environment variables`,
      };
    } else if (Object.keys(dateFields).length > 0) {
      recommendation = {
        message: 'No known ETD field names matched. Review the dateFields list below and identify the correct one, then set ETD_FIELD_NAME in Vercel.',
        dateFieldsFound: dateFields,
      };
    } else {
      recommendation = {
        message: 'No date fields found at all. The order may not have an ETD set yet, or it may be in a non-standard format.',
      };
    }

    // Save discovery result to Firestore
    const db = getDb();
    await db.collection('cin7FieldDiscovery').add({
      type:          'manual_discovery',
      orderId:       resolvedId,
      orderRef:      resolvedRef,
      scannedAt:     FieldValue.serverTimestamp(),
      etdCandidates,
      dateFields,
      recommendation,
    });

    return res.status(200).json({
      orderId:        resolvedId,
      orderRef:       resolvedRef,
      recommendation,
      etdCandidates,
      dateFields,
      customFields:   order.AdditionalAttributes ?? {},
      allTopLevelFields: Object.keys(order),
      allEndpointKeys: Object.fromEntries(
        Object.entries(allEndpoints).map(([ep, data]) => [ep, data ? Object.keys(data) : []])
      ),
    });

  } catch (err) {
    console.error('[discover-fields]', err);
    return res.status(500).json({ error: err.message });
  }
}
