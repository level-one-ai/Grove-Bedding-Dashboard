/**
 * label-print-service/api/label-history.js
 * ──────────────────────────────────────────
 * GET /api/label-history
 *
 * Returns the last 50 printed label records from grove-label-print Firestore.
 * The bridge agent writes to labelRuns collection when a label is printed.
 *
 * Environment variables required:
 *   LABEL_FIREBASE_PROJECT_ID
 *   LABEL_FIREBASE_CLIENT_EMAIL
 *   LABEL_FIREBASE_PRIVATE_KEY
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getDb() {
  const appName = 'label-history';
  const existing = getApps().find(a => a.name === appName);
  if (existing) return getFirestore(existing);

  const app = initializeApp({
    credential: cert({
      projectId:   process.env.LABEL_FIREBASE_PROJECT_ID   ?? process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.LABEL_FIREBASE_CLIENT_EMAIL ?? process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  (process.env.LABEL_FIREBASE_PRIVATE_KEY ?? process.env.FIREBASE_PRIVATE_KEY)
                     ?.replace(/\\n/g, '\n'),
    }),
  }, appName);
  return getFirestore(app);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Return empty if Firebase not configured yet
  if (!process.env.LABEL_FIREBASE_PROJECT_ID && !process.env.FIREBASE_PROJECT_ID) {
    return res.status(200).json({
      success: true,
      records: [],
      note: 'grove-label-print Firebase not configured yet',
    });
  }

  try {
    const db   = getDb();
    const snap = await db.collection('labelRuns')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const records = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id:           doc.id,
        runId:        d.runId        ?? doc.id,
        orderRef:     d.orderRef     ?? '',
        customerName: d.customerName ?? '',
        productName:  d.productName  ?? '',
        printedAt:    d.printedAt?.toDate?.()?.toISOString?.() ?? d.createdAt?.toDate?.()?.toISOString?.() ?? '',
        printer:      d.printer      ?? '',
        status:       d.status       ?? 'unknown',
      };
    }).filter(r => r.status === 'printed' || r.status === 'success');

    return res.status(200).json({ success: true, records, count: records.length });

  } catch (err) {
    console.error('[label-history] Error:', err.message);
    return res.status(200).json({
      success: true,
      records: [],
      note: `Firebase error: ${err.message}`,
    });
  }
}
