/**
 * label-print-service/bridge/bridge-agent.js
 * ─────────────────────────────────────────────
 * Grove Bedding — Office Label Bridge Agent (Windows)
 *
 * Runs permanently on the office Windows PC.
 * Every 5 seconds it checks Firestore for queued print jobs.
 * Every 30 seconds it writes a heartbeat so the dashboard shows online status.
 * When a job is found it sends the DYMO XML to DYMO Connect and prints the label.
 *
 * Setup:
 *   1. Install Node.js 18+ from nodejs.org
 *   2. Install DYMO Connect from dymo.com (must be running)
 *   3. npm install  (run once in this folder)
 *   4. Copy .env.example to .env and fill in your Firebase credentials
 *   5. Test: node bridge-agent.js
 *   6. Auto-start: run setup-autostart-windows.bat as Administrator
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { execSync } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import os from 'os';
import dotenv from 'dotenv';

dotenv.config();

// ── Config ────────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS      = parseInt(process.env.POLL_INTERVAL_MS      ?? '5000',  10);
const HEARTBEAT_INTERVAL_MS = parseInt(process.env.HEARTBEAT_INTERVAL_MS ?? '30000', 10);
const MAX_RETRIES           = parseInt(process.env.MAX_RETRIES           ?? '3',     10);
const RETRY_DELAY_MS        = parseInt(process.env.RETRY_DELAY_MS        ?? '30000', 10);
const PRINTER_NAME          = process.env.DYMO_PRINTER_NAME ?? '';
const BRIDGE_ID             = process.env.BRIDGE_ID ?? 'office-windows-pc';

// ── Firebase ──────────────────────────────────────────────────────────────────
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
  console.log(`[${ts}] [${level.toUpperCase()}] ${msg}${detail ? ' — ' + detail : ''}`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Heartbeat ─────────────────────────────────────────────────────────────────
async function writeHeartbeat() {
  try {
    const printer = detectDymoPrinter();
    await db.collection('bridgeStatus').doc(BRIDGE_ID).set({
      bridgeId:       BRIDGE_ID,
      status:         'online',
      lastSeen:       FieldValue.serverTimestamp(),
      lastSeenISO:    new Date().toISOString(),
      hostname:       os.hostname(),
      platform:       os.platform(),
      printerName:    printer,
      version:        '2.0.0',
      pollIntervalMs: POLL_INTERVAL_MS,
    });
    log('info', '♥ Heartbeat', `bridge: ${BRIDGE_ID} | printer: ${printer}`);
  } catch (err) {
    log('warn', 'Heartbeat write failed', err.message);
  }
}

async function writeOffline() {
  try {
    await db.collection('bridgeStatus').doc(BRIDGE_ID).update({
      status:      'offline',
      lastSeen:    FieldValue.serverTimestamp(),
      lastSeenISO: new Date().toISOString(),
    });
    log('info', 'Bridge marked offline');
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
    log('warn', 'Could not auto-detect DYMO printer', e.message);
  }
  return 'DYMO LabelWriter 5 XL';
}

// ── Send label to DYMO Connect ────────────────────────────────────────────────
async function printLabel(dymoXml, printerName) {

  // Strategy 1 — DYMO Connect Web Service (port 41951)
  // This is the preferred method — DYMO Connect runs a local web service
  try {
    const encodedXml = encodeURIComponent(dymoXml.replace(/\r?\n/g, ' '));
    const encodedPrinter = encodeURIComponent(printerName);

    const psCmd = `
      Add-Type -AssemblyName System.Net.Http;
      [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true};
      $client = New-Object System.Net.Http.HttpClient;
      $body = "printerName=${encodedPrinter}&labelXml=${encodedXml}&labelSetXml=";
      $content = New-Object System.Net.Http.StringContent($body, [System.Text.Encoding]::UTF8, 'application/x-www-form-urlencoded');
      $task = $client.PostAsync('https://localhost:41951/DYMO/DLS/Printing/PrintLabel', $content);
      $response = $task.Result;
      Write-Output $response.StatusCode;
    `.trim().replace(/\n/g, ' ');

    const result = execSync(`powershell -NoProfile -Command "${psCmd}"`, {
      encoding: 'utf8',
      timeout: 20000,
    }).trim();

    if (result === 'OK' || result === '200') {
      log('info', '✓ Printed via DYMO Connect Web Service', printerName);
      return;
    }
    throw new Error(`DYMO Web Service returned: ${result}`);

  } catch (wsErr) {
    log('warn', 'DYMO Web Service unavailable, trying file method', wsErr.message);
  }

  // Strategy 2 — Write .dymo file and open with DYMO Connect
  const tmpFile = join(tmpdir(), `grove-label-${Date.now()}.dymo`);
  try {
    writeFileSync(tmpFile, dymoXml, 'utf8');

    // Try DymoPrint.exe CLI first
    const dymoExe = process.env.DYMO_CLI_PATH
      ?? 'C:\\Program Files\\DYMO\\DYMO Connect\\DymoPrint.exe';

    if (existsSync(dymoExe)) {
      execSync(`"${dymoExe}" -p "${printerName}" -f "${tmpFile}"`, { timeout: 20000 });
      log('info', '✓ Printed via DymoPrint.exe', printerName);
      return;
    }

    // Fallback — open with DYMO Connect (user must click print)
    log('warn', 'DymoPrint.exe not found — opening label in DYMO Connect for manual print');
    execSync(`start "" "${tmpFile}"`, { timeout: 5000, shell: true });

  } finally {
    // Give DYMO Connect time to read the file before deleting it
    await sleep(3000);
    try { if (existsSync(tmpFile)) unlinkSync(tmpFile); } catch {}
  }
}

// ── Process a single print job ────────────────────────────────────────────────
async function processJob(jobDoc) {
  const job    = jobDoc.data();
  const jobRef = jobDoc.ref;
  const runRef = db.collection('labelRuns').doc(job.runId);

  log('info', `Processing job ${job.runId}`, `order: ${job.orderRef} | customer: ${job.customerName}`);

  try {
    await jobRef.update({ status: 'processing', startedAt: FieldValue.serverTimestamp() });
    await runRef.update({ status: 'printing' }).catch(() => {});

    const printer = detectDymoPrinter();
    log('info', 'Sending to printer', printer);

    await printLabel(job.dymoXml, printer);

    await jobRef.update({
      status:    'printed',
      printer,
      printedAt: FieldValue.serverTimestamp(),
    });
    await runRef.update({
      status:    'printed',
      printer,
      printedAt: FieldValue.serverTimestamp(),
    }).catch(() => {});

    log('info', `✓ Job ${job.runId} printed on ${printer}`);

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

// ── Poll Firestore for jobs ───────────────────────────────────────────────────
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
log('info', '  Grove Bedding — Label Bridge Agent v2.0');
log('info', `  Poll every ${POLL_INTERVAL_MS / 1000}s | Heartbeat every ${HEARTBEAT_INTERVAL_MS / 1000}s`);
log('info', `  Firebase: ${process.env.FIREBASE_PROJECT_ID}`);
log('info', `  Bridge ID: ${BRIDGE_ID}`);
log('info', '══════════════════════════════════════════');

db.collection('printQueue').limit(1).get()
  .then(async () => {
    log('info', '✓ Firestore connection confirmed');
    await writeHeartbeat();
    setInterval(writeHeartbeat, HEARTBEAT_INTERVAL_MS);
    poll();
    setInterval(poll, POLL_INTERVAL_MS);
  })
  .catch(err => {
    log('error', '✗ Firestore connection FAILED', err.message);
    log('error', 'Check your .env credentials and try again');
    process.exit(1);
  });

process.on('SIGTERM', async () => { log('info', 'Stopping'); await writeOffline(); process.exit(0); });
process.on('SIGINT',  async () => { log('info', 'Stopping'); await writeOffline(); process.exit(0); });
