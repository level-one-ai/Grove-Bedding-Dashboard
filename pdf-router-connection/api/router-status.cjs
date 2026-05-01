/**
 * pdf-router-connection/api/router-status.cjs
 * ─────────────────────────────────────────────
 * GET /api/router-status
 *
 * Reads recent PDF Router status from the PDF Router's Firebase Firestore.
 * The dashboard frontend calls this as a fallback when direct Firestore
 * connection is not available (e.g. Firestore rules are restrictive).
 *
 * In most cases the dashboard connects directly to Firestore via the
 * VITE_PDF_ROUTER_FIREBASE_* environment variables instead.
 *
 * Environment variables required:
 *   PDF_ROUTER_FIREBASE_PROJECT_ID
 *   PDF_ROUTER_FIREBASE_CLIENT_EMAIL
 *   PDF_ROUTER_FIREBASE_PRIVATE_KEY
 */

const admin = require('firebase-admin');

function getRouterDb() {
  const existing = admin.apps.find(a => a?.name === 'pdf-router-server');
  if (existing) return existing.firestore();

  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.PDF_ROUTER_FIREBASE_PROJECT_ID,
      clientEmail: process.env.PDF_ROUTER_FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.PDF_ROUTER_FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  }, 'pdf-router-server');
  return app.firestore();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });

  try {
    const db = getRouterDb();

    const [statusSnap, errorsSnap, activitySnap] = await Promise.all([
      db.collection('pdfRouterStatus').orderBy('updatedAt', 'desc').limit(50).get(),
      db.collection('pdfRouterErrors').orderBy('createdAt', 'desc').limit(20).get(),
      db.collection('pdfRouterActivity').orderBy('createdAt', 'desc').limit(30).get(),
    ]);

    return res.status(200).json({
      success: true,
      files:    statusSnap.docs.map(d => ({ fileId: d.id, ...d.data() })),
      errors:   errorsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      activity: activitySnap.docs.map(d => ({ id: d.id, ...d.data() })),
    });
  } catch (err) {
    return res.status(200).json({ success: false, error: err.message, files: [], errors: [], activity: [] });
  }
};
