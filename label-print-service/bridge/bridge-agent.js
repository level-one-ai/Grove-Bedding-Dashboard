/**
 * label-print-service/bridge/bridge-agent.js
 * ─────────────────────────────────────────────
 * Grove Bedding — Office Label Bridge Agent (Windows)
 *
 * Runs permanently on the office Windows PC.
 * Every 5 seconds it checks Firestore for queued print jobs
 * and sends them to the DYMO 5XL connected via USB.
 * Every 30 seconds it writes a heartbeat to Firestore so the
 * dashboard can show a live connection indicator.
 *
 * Setup:
 *   1. Install Node.js 18+ from nodejs.org
 *   2. Install DYMO Connect from dymo.com (keep it running)
 *   3. Run: npm install   (once, in this folder)
 *   4. Copy .env.example to .env and fill in your Firebase details
 *   5. Test: node bridge-agent.js
 *   6. Auto-start: run setup-autostart-windows.bat as Administrator
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

// ── Config ────────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS      = parseInt(process.env.POLL_INTERVAL_MS      ?? '5000',  10);
const HEARTBEAT_INTERVAL_MS = parseInt(process.env.HEARTBEAT_INTERVAL_MS ?? '30000', 10);
const MAX_RETRIES            = parseInt(process.env.MAX_RETRIES           ?? '3',     10);
const RETRY_DELAY_MS         = parseInt(process.env.RETRY_DELAY_MS        ?? '30000', 10);
const PRINTER_NAME           = process.env.DYMO_PRINTER_NAME ?? '';
const BRIDGE_ID              = process.env.BRIDGE_ID ?? 'office-windows-pc';

// ── Firebase init ─────────────────────────────────────────────────────────────
initializeApp({
  credential: cert({
    projectId:   process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore();

// ── Logging ───────────────────────────────────────────────────────────────────
function log(level, msg, detail = '') {
  const ts = new Date().toLocaleString('en-GB');
  const line = `[${ts}] [${level.toUpperCase()}] ${msg}${detail ? ' — ' + detail : ''}`;
  console.log(line);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Heartbeat ─────────────────────────────────────────────────────────────────
// Writes a timestamp to Firestore every 30 seconds.
// The dashboard reads this and shows a green dot if the heartbeat
// is less than 60 seconds old, red dot if older or missing.
async function writeHeartbeat() {
  try {
    const printer = detectDymoPrinter();
    await db.collection('bridgeStatus').doc(BRIDGE_ID).set({
      bridgeId:     BRIDGE_ID,
      status:       'online',
      lastSeen:     FieldValue.serverTimestamp(),
      lastSeenISO:  new Date().toISOString(),
      hostname:     os.hostname(),
      platform:     os.platform(),
      printerName:  printer,
      version:      '1.0.0',
      pollIntervalMs: POLL_INTERVAL_MS,
    });
    log('info', '♥ Heartbeat written', `bridge: ${BRIDGE_ID}`);
  } catch (err) {
    log('warn', 'Heartbeat write failed', err.message);
  }
}

// Write offline status when bridge shuts down cleanly
async function writeOffline() {
  try {
    await db.collection('bridgeStatus').doc(BRIDGE_ID).update({
      status:      'offline',
      lastSeen:    FieldValue.serverTimestamp(),
      lastSeenISO: new Date().toISOString(),
    });
    log('info', 'Bridge marked offline in Firestore');
  } catch {}
}

// ── Detect DYMO printer ───────────────────────────────────────────────────────
function detectDymoPrinter() {
  if (PRINTER_NAME) return PRINTER_NAME;
  try {
    const result = execSync(
      `powershell -NoProfile -Command "Get-Printer | Where-Object { $_.Name -like '*DYMO*' } | Select-Object -First 1 -ExpandProperty Name"`,
      { encoding: 'utf8', timeout: 8000 }
    ).trim();
    if (result) return result;
  } catch (e) {
    log('warn', 'PowerShell printer query failed', e.message);
  }
  return 'DYMO LabelWriter 5 XL';
}

// ── Print a label ─────────────────────────────────────────────────────────────
async function printLabel(dymoXml, printerName) {

  // Strategy 1: DYMO Connect Web Service (port 41951)
  try {
    const psCmd = `
      [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true};
      $body = 'printerName=${printerName.replace(/'/g, "''")}&labelXml=' + [Uri]::EscapeDataString('${dymoXml.replace(/'/g, "''").replace(/\n/g, ' ')}') + '&labelSetXml=';
      $r = Invoke-WebRequest -Uri 'https://localhost:41951/DYMO/DLS/Printing/PrintLabel' -Method POST -Body $body -ContentType 'application/x-www-form-urlencoded' -UseBasicParsing;
      $r.StatusCode
    `.trim();

    const result = execSync(`powershell -NoProfile -Command "${psCmd}"`, {
      encoding: 'utf8', timeout: 15000,
    }).trim();

    if (result === '200') {
      log('info', '✓ Printed via DYMO Connect Web Service');
      return;
    }
    throw new Error(`DYMO Web Service returned: ${result}`);

  } catch (wsErr) {
    log('warn', 'DYMO Web Service unavailable — trying CLI', wsErr.message);
  }

  // Strategy 2: DymoPrint.exe CLI fallback
  const dymoExe = process.env.DYMO_CLI_PATH
    ?? 'C:\\Program Files\\DYMO\\DYMO Connect\\DymoPrint.exe';

  if (!existsSync(dymoExe)) {
    throw new Error(
      `DymoPrint.exe not found at: ${dymoExe}\n` +
      `Make sure DYMO Connect is installed, or set DYMO_CLI_PATH in .env`
    );
  }

  const tmpFile = join(tmpdir(), `grove-label-${Date.now()}.dymo`);
  try {
    writeFileSync(tmpFile, dymoXml, 'utf8');
    execSync(`"${dymoExe}" -p "${printerName}" -f "${tmpFile}"`, { timeout: 15000 });
    log('info', '✓ Printed via DymoPrint.exe CLI');
  } finally {
    if (existsSync(tmpFile)) {
      try { unlinkSync(tmpFile); } catch {}
    }
  }
}

// ── Process a single print job ────────────────────────────────────────────────
async function processJob(jobDoc) {
  const job    = jobDoc.data();
  const jobRef = jobDoc.ref;
  const runRef = db.collection('labelRuns').doc(job.runId);

  log('info', `Processing job ${job.runId}`, `order ${job.orderRef}`);

  try {
    await jobRef.update({ status: 'processing', startedAt: FieldValue.serverTimestamp() });

    const printer = detectDymoPrinter();
    log('info', 'Printer detected', printer);

    await printLabel(job.dymoXml, printer);

    await jobRef.update({
      status:    'printed',
      printer,
      printedAt: FieldValue.serverTimestamp(),
    });
    await runRef.update({ status: 'success', printer }).catch(() => {});

    log('info', `✓ Job ${job.runId} printed successfully on ${printer}`);

  } catch (err) {
    log('error', `Job ${job.runId} failed`, err.message);

    const attempts = (job.attempts ?? 0) + 1;

    if (attempts >= MAX_RETRIES) {
      await jobRef.update({ status: 'failed', error: err.message, attempts });
      await runRef.update({ status: 'failed', error: err.message }).catch(() => {});
      log('error', `Job ${job.runId} exhausted ${MAX_RETRIES} retries — marked failed`);
    } else {
      const retryAt = new Date(Date.now() + RETRY_DELAY_MS);
      await jobRef.update({ status: 'queued', attempts, retryAt, lastError: err.message });
      log('warn', `Job ${job.runId} will retry (attempt ${attempts}/${MAX_RETRIES})`);
    }
  }
}

// ── Poll Firestore for queued jobs ────────────────────────────────────────────
async function poll() {
  try {
    const snap = await db.collection('printQueue')
      .where('status', '==', 'queued')
      .orderBy('createdAt', 'asc')
      .limit(3)
      .get();

    for (const doc of snap.docs) {
      await processJob(doc);
    }
  } catch (err) {
    log('error', 'Poll error', err.message);
  }
}

// ── Startup ───────────────────────────────────────────────────────────────────
log('info', '══════════════════════════════════════════');
log('info', '  Grove Bedding — Label Bridge Agent');
log('info', `  Polling Firestore every ${POLL_INTERVAL_MS / 1000}s`);
log('info', `  Heartbeat every ${HEARTBEAT_INTERVAL_MS / 1000}s`);
log('info', `  Project: ${process.env.FIREBASE_PROJECT_ID}`);
log('info', `  Bridge ID: ${BRIDGE_ID}`);
log('info', '══════════════════════════════════════════');

// Verify Firebase connection on startup
db.collection('printQueue').limit(1).get()
  .then(async () => {
    log('info', '✓ Firestore connection confirmed');
    // Write first heartbeat immediately on startup
    await writeHeartbeat();
    // Then write heartbeat every 30 seconds
    setInterval(writeHeartbeat, HEARTBEAT_INTERVAL_MS);
    // Start polling for print jobs
    poll();
    setInterval(poll, POLL_INTERVAL_MS);
  })
  .catch(err => {
    log('error', '✗ Firestore connection FAILED', err.message);
    log('error', 'Check your .env Firebase credentials and try again');
    process.exit(1);
  });

// Write offline status on clean shutdown
process.on('SIGTERM', async () => {
  log('info', 'Bridge agent stopping');
  await writeOffline();
  process.exit(0);
});
process.on('SIGINT', async () => {
  log('info', 'Bridge agent stopping');
  await writeOffline();
  process.exit(0);
});
