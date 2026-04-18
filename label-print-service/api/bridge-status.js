/**
 * label-print-service/api/bridge-status.js
 * ──────────────────────────────────────────
 * GET /bridge-status
 * Returns whether the office Windows bridge agent is online.
 * The bridge writes a heartbeat to Firestore every 30 seconds.
 * If the heartbeat is older than 90 seconds the bridge is offline.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const OFFLINE_THRESHOLD_SECONDS = 90;
const BRIDGE_ID = process.env.BRIDGE_ID ?? 'office-windows-pc';

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const db  = getDb();
    const doc = await db.collection('bridgeStatus').doc(BRIDGE_ID).get();

    if (!doc.exists) {
      return res.status(200).json({
        online:   false,
        bridgeId: BRIDGE_ID,
        error:    'never_connected',
        message:  'Bridge has never connected. Run setup on the office PC.',
      });
    }

    const data       = doc.data();
    const lastSeen   = data.lastSeen?.toDate?.() ?? new Date(data.lastSeenISO ?? 0);
    const secondsAgo = Math.floor((Date.now() - lastSeen.getTime()) / 1000);
    const online     = secondsAgo < OFFLINE_THRESHOLD_SECONDS;

    return res.status(200).json({
      online,
      bridgeId:    data.bridgeId    ?? BRIDGE_ID,
      status:      online ? 'online' : 'offline',
      lastSeen:    lastSeen.toISOString(),
      secondsAgo,
      hostname:    data.hostname    ?? null,
      platform:    data.platform    ?? null,
      printerName: data.printerName ?? null,
      version:     data.version     ?? null,
      message:     online
        ? `Connected · last seen ${secondsAgo}s ago`
        : `Offline · last seen ${secondsAgo}s ago`,
    });
  } catch (err) {
    return res.status(500).json({ online: false, error: 'firestore_error', message: err.message });
  }
}
