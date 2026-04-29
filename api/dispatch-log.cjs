/**
 * label-print-service/api/dispatch-log.js
 * ─────────────────────────────────────────
 * GET  /api/dispatch-log   — fetch dispatch records
 * POST /api/dispatch-log   — add a dispatch record
 *
 * Reads and writes to the grove-dispatch Firebase project.
 * Returns empty gracefully if Firebase is not yet configured.
 *
 * Environment variables required (when ready):
 *   DISPATCH_FIREBASE_PROJECT_ID
 *   DISPATCH_FIREBASE_CLIENT_EMAIL
 *   DISPATCH_FIREBASE_PRIVATE_KEY
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

function getDb() {
  const appName = 'dispatch-log';
  const existing = getApps().find(a => a.name === appName);
  if (existing) return getFirestore(existing);

  const projectId   = process.env.DISPATCH_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.DISPATCH_FIREBASE_CLIENT_EMAIL;
  const privateKey  = process.env.DISPATCH_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) return null;

  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) }, appName);
  return getFirestore(app);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Return empty if Dispatch Firebase not yet configured
  const db = getDb();
  if (!db) {
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        records: [],
        note: 'grove-dispatch Firebase not configured yet. Set DISPATCH_FIREBASE_PROJECT_ID, DISPATCH_FIREBASE_CLIENT_EMAIL, DISPATCH_FIREBASE_PRIVATE_KEY in Vercel env vars.',
      });
    }
    return res.status(200).json({
      success: false,
      error: 'grove-dispatch Firebase not configured yet',
    });
  }

  // GET — fetch dispatch records
  if (req.method === 'GET') {
    try {
      const snap = await db.collection('dispatches')
        .orderBy('dispatchDate', 'desc')
        .limit(50)
        .get();

      const records = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id:             doc.id,
          orderRef:       d.orderRef       ?? '',
          customerName:   d.customerName   ?? '',
          dispatchDate:   d.dispatchDate?.toDate?.()?.toISOString?.() ?? d.dispatchDate ?? '',
          carrier:        d.carrier        ?? '',
          trackingNumber: d.trackingNumber ?? '',
          status:         d.status         ?? 'dispatched',
          notes:          d.notes          ?? '',
        };
      });

      return res.status(200).json({ success: true, records, count: records.length });

    } catch (err) {
      return res.status(200).json({
        success: true,
        records: [],
        note: `Firebase error: ${err.message}`,
      });
    }
  }

  // POST — add a dispatch record
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const { orderRef, customerName, carrier, trackingNumber, notes } = body ?? {};
    if (!orderRef) return res.status(400).json({ success: false, error: 'orderRef required' });

    try {
      const docRef = await db.collection('dispatches').add({
        orderRef,
        customerName:   customerName   ?? '',
        carrier:        carrier        ?? '',
        trackingNumber: trackingNumber ?? '',
        notes:          notes          ?? '',
        status:         'dispatched',
        dispatchDate:   FieldValue.serverTimestamp(),
        createdAt:      FieldValue.serverTimestamp(),
      });

      return res.status(200).json({
        success: true,
        id: docRef.id,
        message: `Dispatch record created for ${orderRef}`,
      });

    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
