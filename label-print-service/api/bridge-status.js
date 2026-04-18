/**
 * label-print-service/api/bridge-status.js
 * ──────────────────────────────────────────
 * Vercel serverless function — GET /api/bridge-status
 *
 * Reads the heartbeat document from Firestore that the office PC
 * bridge agent writes every 30 seconds.
 *
 * Returns:
 *   { online: true, lastSeen: "...", secondsAgo: 12, printerName: "...", hostname: "..." }
 *   { online: false, lastSeen: "...", secondsAgo: 95, ... }
 *   { online: false, error: "never_connected" }
 *
 * The dashboard polls this every 15 seconds to show the live
 * connection indicator on the Label Management page.
 *
 * A bridge is considered ONLINE if its last heartbeat was less than
 * 90 seconds ago (3 × the 30 second heartbeat interval — allows for
 * one missed heartbeat before showing as offline).
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const OFFLINE_THRESHOLD_SECONDS = 90;
const BRIDGE_ID = process.env.BRIDGE_ID ?? 'office-windows-pc';

function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   process.env.LABEL_FIREBASE_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.LABEL_FIREBASE_CLIENT_EMAIL ?? process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  (process.env.LABEL_FIREBASE_PRIVATE_KEY ?? process.env.FIREBASE_PRIVATE_KEY)
                       ?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

export default async function handler(req, res) {
  // Allow dashboard to poll this from the browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db  = getDb();
    const doc = await db.collection('bridgeStatus').doc(BRIDGE_ID).get();

    // Bridge has never connected
    if (!doc.exists) {
      return res.status(200).json({
        online:    false,
        bridgeId:  BRIDGE_ID,
        error:     'never_connected',
        message:   'Bridge has never connected. Make sure the office PC is running bridge-agent.js.',
      });
    }

    const data      = doc.data();
    const lastSeen  = data.lastSeen?.toDate?.() ?? new Date(data.lastSeenISO ?? 0);
    const secondsAgo = Math.floor((Date.now() - lastSeen.getTime()) / 1000);
    const online    = secondsAgo < OFFLINE_THRESHOLD_SECONDS;

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
        : `Offline · last seen ${secondsAgo}s ago — check office PC`,
    });

  } catch (err) {
    console.error('[bridge-status]', err);
    return res.status(500).json({
      online:  false,
      error:   'firestore_error',
      message: err.message,
    });
  }
}
