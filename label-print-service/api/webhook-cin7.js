/**
 * label-print-service/api/webhook-cin7.js
 * ─────────────────────────────────────────
 * Vercel serverless function — POST /webhook-cin7
 *
 * Called by Cin7 Omni when an order is created or updated.
 * The webhook payload contains the order ID. This function then:
 *   1. Receives the webhook from Cin7
 *   2. Does a GET request to Cin7 API to fetch full order details
 *   3. Builds a real DYMO XML label using the order data
 *   4. Queues the print job in Firestore
 *   5. The bridge agent on the office PC picks it up and prints it
 *
 * Environment variables required:
 *   CIN7_API_KEY          - Cin7 API key
 *   CIN7_API_USERNAME     - Cin7 API username
  *   LABEL_FIREBASE_PROJECT_ID
 *   LABEL_FIREBASE_CLIENT_EMAIL
 *   LABEL_FIREBASE_PRIVATE_KEY
 *   WEBHOOK_SECRET        - optional shared secret for webhook validation
 *   ETD_FIELD_NAME        - name of the ETD/delivery date field in Cin7 (e.g. "ETD")
 *                           leave blank to skip delivery date
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { buildDymoXml } from '../templates/dymo-template.js';

// ── Firebase ─────────────────────────────────────────────────────────────────

function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   process.env.LABEL_FIREBASE_PROJECT_ID   ?? process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.LABEL_FIREBASE_CLIENT_EMAIL ?? process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  (process.env.LABEL_FIREBASE_PRIVATE_KEY ?? process.env.FIREBASE_PRIVATE_KEY)
                       ?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

// ── Cin7 API helpers ──────────────────────────────────────────────────────────

function cin7Headers() {
  const creds = Buffer.from(
    `${process.env.CIN7_API_USERNAME}:${process.env.CIN7_API_KEY}`
  ).toString('base64');
  return {
    'Authorization': `Basic ${creds}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

async function fetchOrderFromCin7(orderId) {
  // Cin7 Omni API — fetch a sales order by ID
  const url = `https://api.cin7.com/api/v1/SalesOrders/${encodeURIComponent(orderId)}`;

  const res = await fetch(url, { headers: cin7Headers() });
  if (!res.ok) {
    throw new Error(`Cin7 Omni GET failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  // Cin7 Omni returns array or wrapped in Data
  if (Array.isArray(data)) return data[0];
  return data?.Data ?? data;
}

// ── Order data → label fields ─────────────────────────────────────────────────

function buildLabelData(order, labelIndex = 0, totalLabels = 1) {
  // Cin7 Omni field names
  const shipTo = order.ShippingAddress ?? order.DeliveryAddress ?? {};
  const customerName = [
    shipTo.Name ?? order.MemberEmail ?? '',
    shipTo.Company ?? '',
  ].filter(Boolean).join(', ') || order.Company ?? 'Unknown';

  // Delivery address
  const addressParts = [
    shipTo.Line1 ?? shipTo.Address1,
    shipTo.Line2 ?? shipTo.Address2,
    shipTo.City,
    shipTo.State,
    shipTo.Country,
    shipTo.PostCode ?? shipTo.Postcode,
  ].filter(Boolean);
  const address = addressParts.join(', ');

  // Order reference
  const orderRef = order.Reference ?? order.OrderNumber ?? order.Id ?? '';

  // ETD / delivery date
  let deliveryDate = '';
  const etdField = process.env.ETD_FIELD_NAME;
  if (etdField && order[etdField]) {
    // Format the date to DD/MM/YYYY if it's an ISO string
    try {
      const d = new Date(order[etdField]);
      deliveryDate = d.toLocaleDateString('en-GB');
    } catch {
      deliveryDate = String(order[etdField]);
    }
  }

  // Cin7 Omni line items
  const lines = (order.LineItems ?? order.Lines ?? order.SaleOrderLines ?? [])
    .filter(l => l.Name ?? l.ProductName);

  const firstLine  = lines[0] ?? {};
  const secondLine = lines[1] ?? {};
  const thirdLine  = lines[2] ?? {};

  const productName = firstLine.Name ?? firstLine.ProductName ?? '';
  const productSize = firstLine.Option1 ?? firstLine.Unit ?? '';
  const extraLine1  = secondLine.Name ?? secondLine.ProductName ?? '';
  const extraLine2  = thirdLine.Name  ?? thirdLine.ProductName  ?? '';

  // Parcel count
  const parcelCount = `${labelIndex + 1}/${totalLabels}`;

  return {
    orderRef,
    customerName,
    deliveryDate,
    address,
    productName,
    productSize,
    extraLine1,
    extraLine2,
    parcelCount,
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Optional webhook secret validation
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const provided = req.headers['x-webhook-secret'] ?? req.headers['authorization'];
    if (!provided || !provided.includes(secret)) {
      console.warn('[webhook-cin7] Unauthorized request — secret mismatch');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  // Cin7 Omni webhook sends order ID in various fields
  const orderId = body?.Id ?? body?.ID ?? body?.SalesOrderId ?? body?.OrderId ?? body?.id;

  if (!orderId) {
    console.error('[webhook-cin7] No order ID in payload:', JSON.stringify(body));
    return res.status(400).json({ error: 'No order ID found in webhook payload' });
  }

  console.log(`[webhook-cin7] Received webhook for order: ${orderId}`);

  try {
    // 1. Fetch full order details from Cin7
    console.log(`[webhook-cin7] Fetching order ${orderId} from Cin7...`);
    const order = await fetchOrderFromCin7(orderId);
    console.log(`[webhook-cin7] Order fetched: ${order.OrderNumber ?? orderId}`);

    // 2. Build label data and DYMO XML
    const labelData = buildLabelData(order, 0, 1);
    const dymoXml   = buildDymoXml(labelData);

    // 3. Queue the print job in Firestore
    const db     = getDb();
    const runId  = `label-${Date.now()}-${orderId}`;
    const jobRef = db.collection('printQueue').doc(runId);

    await jobRef.set({
      runId,
      orderId,
      orderRef:     labelData.orderRef,
      customerName: labelData.customerName,
      address:      labelData.address,
      productName:  labelData.productName,
      deliveryDate: labelData.deliveryDate,
      dymoXml,
      labelData,
      status:    'queued',
      createdAt: FieldValue.serverTimestamp(),
      attempts:  0,
    });

    // 4. Also write a labelRun record for the dashboard to track
    await db.collection('labelRuns').doc(runId).set({
      runId,
      orderId,
      orderRef:     labelData.orderRef,
      customerName: labelData.customerName,
      status:    'queued',
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log(`[webhook-cin7] Print job queued: ${runId}`);

    return res.status(200).json({
      success: true,
      runId,
      orderRef: labelData.orderRef,
      customer: labelData.customerName,
      message: 'Label queued for printing',
    });

  } catch (err) {
    console.error('[webhook-cin7] Error:', err.message);
    return res.status(500).json({
      error: 'Failed to process label request',
      detail: err.message,
    });
  }
}
