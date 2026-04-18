# Grove Bedding — Label Print Service
## Full Setup Guide + Testing Procedures

---

## Overview

```
Cin7 Omni                  Vercel (cloud)                Firestore              Office PC (Windows)
    │                           │                              │                        │
    │── ETD field updated ──────►│                             │                        │
    │                           │── fetch all order fields ──►│ Cin7 API               │
    │                           │── log ALL fields ───────────►│                        │
    │                           │── detect ETD field ─────────►│                        │
    │                           │── queue print job ──────────►│                        │
    │                           │                              │◄─── poll every 5s ─────│
    │                           │                              │──── send job ──────────►│
    │                           │                              │                        │── print ──► DYMO 5XL
```

---

## PART 1 — Firebase Setup (grove-label-print)

### Step 1 — Create the Firebase Project

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)**
2. Click **Add project**
3. Name it: **`grove-label-print`**
4. Disable Google Analytics (not needed)
5. Click **Create project**

---

### Step 2 — Enable Firestore

1. In your new project, click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in production mode**
4. Select region: **`europe-west2`** (London — closest to you)
5. Click **Enable**

Wait about 30 seconds for it to provision.

---

### Step 3 — Create the Collections

Firestore creates collections automatically when the first document is written, but you can create them manually to confirm everything is working.

1. Click **+ Start collection**
2. Create these four collections (just click through, you can delete the placeholder documents after):

| Collection Name | Purpose |
|---|---|
| `printQueue` | Jobs waiting to be picked up by the office PC |
| `labelRuns` | Audit log of every webhook received |
| `webhookPayloads` | Raw Cin7 webhook payloads (for debugging) |
| `cin7FieldDiscovery` | Full field maps from Cin7 (for finding ETD field) |

---

### Step 4 — Create a Service Account

This gives your Vercel backend and office PC bridge permission to read/write Firestore.

1. In Firebase console, click the **gear icon** → **Project settings**
2. Click the **Service accounts** tab
3. Make sure **Firebase Admin SDK** is selected
4. Click **Generate new private key**
5. Click **Generate key** — this downloads a `.json` file
6. **Save this file somewhere safe** — you will need values from it

The downloaded JSON looks like this:
```json
{
  "type": "service_account",
  "project_id": "grove-label-print",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@grove-label-print.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

You need three values from this file:
- `project_id` → used as `FIREBASE_PROJECT_ID`
- `client_email` → used as `FIREBASE_CLIENT_EMAIL`
- `private_key` → used as `FIREBASE_PRIVATE_KEY`

---

### Step 5 — Set Firestore Security Rules

1. In Firebase console, click **Firestore Database** → **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // All access is via the Admin SDK (service account) which bypasses these rules.
    // Block direct client access to everything.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **Publish**

---

## PART 2 — Vercel Environment Variables

Go to **Vercel → your project → Settings → Environment Variables** and add:

| Variable Name | Value | Where to get it |
|---|---|---|
| `FIREBASE_PROJECT_ID` | `grove-label-print` | Your Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxxxx@grove-label-print.iam.gserviceaccount.com` | From the service account JSON |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n` | From the service account JSON — paste the entire value including the `\n` characters exactly as they appear |
| `CIN7_API_KEY` | Your Cin7 API key | Cin7 Omni → Integrations → API |
| `CIN7_API_USERNAME` | Your Cin7 username / account name | Cin7 Omni → Integrations → API |
| `CIN7_BASE_URL` | `https://inventory.dearsystems.com/ExternalApi/v2` | Standard Cin7 Omni URL |
| `WEBHOOK_SECRET` | Any random string you choose | Make this up — e.g. `grove-secret-2025` |
| `ETD_FIELD_NAME` | *(leave blank for now — set after field discovery)* | Found during testing below |

> **Important note on FIREBASE_PRIVATE_KEY**: In the JSON file the key contains actual newline characters. When you paste into Vercel, paste it exactly as it appears — Vercel handles this correctly. Do NOT manually replace newlines with `\n` text — Vercel's UI preserves them.

---

## PART 3 — Cin7 Omni Webhook Setup

### Step 1 — Find your Cin7 API credentials

1. In Cin7 Omni, go to **Integrations** → **API**
2. Note your **API Key** and **Account Name** (this is the username)

### Step 2 — Create the Webhook in Cin7

1. In Cin7 Omni, go to **Integrations** → **Webhooks**
2. Click **Add Webhook**
3. Configure:
   - **Name**: `Grove Label Printer`
   - **Event Type**: `Sale Order` → `Updated` (this fires whenever any field on an order changes, including ETD)
   - **URL**: `https://your-vercel-domain.vercel.app/api/webhook-cin7`
   - **Method**: POST
   - **Content Type**: application/json
4. Add a custom header:
   - **Header name**: `x-webhook-secret`
   - **Header value**: the same value you set as `WEBHOOK_SECRET` in Vercel
5. Save the webhook

> If Cin7 asks you to verify the endpoint, it will send a GET request first. The webhook endpoint only accepts POST so verification may show a 405 — this is fine, the webhook still works.

---

## PART 4 — Office PC Bridge Setup (Windows)

### Prerequisites

- Windows 10 or 11
- DYMO 5XL connected via USB and printing normally in DYMO Connect
- Internet connection (for Firestore)

### Step 1 — Install Node.js

1. Go to **[nodejs.org](https://nodejs.org)**
2. Download and install the **LTS version** (20.x or higher)
3. Accept all defaults
4. When done, open **Command Prompt** and verify:
   ```
   node --version
   ```
   Should print something like `v20.15.0`

### Step 2 — Install DYMO Connect

1. Go to **[dymo.com](https://www.dymo.com)** → Support → Software → DYMO Connect
2. Download and install DYMO Connect
3. Open DYMO Connect and confirm your DYMO 5XL shows as connected and ready
4. **Leave DYMO Connect running** — the bridge uses its local web service to print

### Step 3 — Set Up the Bridge Agent

1. Copy the `label-print-service/bridge/` folder to the office PC
   - You can do this via USB drive, email yourself the folder, or clone from GitHub
   - Suggested location: `C:\GroveLabelBridge\`

2. Open **Command Prompt** in that folder:
   ```
   cd C:\GroveLabelBridge
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Create your `.env` file:
   - Copy `.env.example` to `.env`
   - Open `.env` in Notepad
   - Fill in your Firebase credentials (same values as Vercel):
   ```
   FIREBASE_PROJECT_ID=grove-label-print
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@grove-label-print.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n
   DYMO_PRINTER_NAME=
   POLL_INTERVAL_MS=5000
   MAX_RETRIES=3
   RETRY_DELAY_MS=30000
   ```

   > For `FIREBASE_PRIVATE_KEY` in the `.env` file: replace actual newline characters with the literal text `\n`. The easiest way is to open the service account JSON, copy the `private_key` value, and paste it as one long line.

### Step 4 — Test the Bridge Manually

Run it once to confirm it connects:
```
node bridge-agent.js
```

You should see:
```
[DD/MM/YYYY, HH:MM:SS] [INFO] ══════════════════════════════════════════
[DD/MM/YYYY, HH:MM:SS] [INFO]   Grove Bedding — Label Bridge Agent
[DD/MM/YYYY, HH:MM:SS] [INFO]   Polling Firestore every 5s
[DD/MM/YYYY, HH:MM:SS] [INFO]   Project: grove-label-print
[DD/MM/YYYY, HH:MM:SS] [INFO] ══════════════════════════════════════════
[DD/MM/YYYY, HH:MM:SS] [INFO] ✓ Firestore connection confirmed
```

If you see `✗ Firestore connection FAILED` — check your `.env` credentials.

Press `Ctrl + C` to stop once you have confirmed it connects.

### Step 5 — Set Bridge to Auto-Start on Boot

1. Right-click `setup-autostart-windows.bat`
2. Select **Run as administrator**
3. You should see: `[OK] Task "GroveLabelBridge" registered successfully`

The bridge will now start automatically every time the PC boots, even before anyone logs in.

To verify it's running after a reboot:
```
# In Command Prompt:
schtasks /query /tn GroveLabelBridge
```

---

## PART 5 — Testing the System

Run these tests in order. Each one builds on the previous.

---

### Test 1 — Firestore Connection (Bridge)

**Goal**: Confirm the office PC can talk to Firebase.

On the office PC, run:
```
node bridge-agent.js
```

**Pass**: You see `✓ Firestore connection confirmed`
**Fail**: Check `.env` credentials match the service account JSON exactly

---

### Test 2 — Cin7 Field Discovery (Manual)

**Goal**: Find out what the ETD field is actually called in your Cin7 account.

Open a browser and go to:
```
https://your-vercel-domain.vercel.app/api/discover-fields?orderId=YOUR_ORDER_ID
```

Add the header `x-webhook-secret: your-secret` — easiest way is to use a browser extension like **Requestly** or **ModHeader**, or use the curl command below.

**Using curl (run in Command Prompt or PowerShell):**
```bash
curl -H "x-webhook-secret: your-webhook-secret" \
  "https://your-vercel-domain.vercel.app/api/discover-fields?orderId=YOUR_CIN7_ORDER_ID"
```

Replace `YOUR_CIN7_ORDER_ID` with any real order ID from your Cin7 account. Use an order that has an ETD/delivery date already set.

**What the response looks like:**
```json
{
  "orderId": "12345",
  "orderRef": "5775-SH",
  "recommendation": {
    "fieldName": "RequiredDate",
    "value": "2025-07-14T00:00:00",
    "action": "Set ETD_FIELD_NAME=RequiredDate in your Vercel environment variables"
  },
  "etdCandidates": {
    "RequiredDate": { "value": "2025-07-14T00:00:00", "source": "top_level" }
  },
  "dateFields": {
    "sale.OrderDate": "2025-07-01",
    "sale.RequiredDate": "2025-07-14",
    "sale.InvoiceDate": "2025-07-02"
  },
  "allTopLevelFields": ["ID", "SaleOrderNumber", "Status", "RequiredDate", ...]
}
```

**Pass**: You see `recommendation` with a field name and value
**Action**: Go to Vercel → Settings → Environment Variables → set `ETD_FIELD_NAME` to the field name shown

---

### Test 3 — Webhook Endpoint (End-to-End without printing)

**Goal**: Confirm Vercel receives and processes a webhook correctly.

Send a test webhook manually:
```bash
curl -X POST https://your-vercel-domain.vercel.app/api/webhook-cin7 \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-webhook-secret" \
  -d '{"ID": "YOUR_CIN7_ORDER_ID"}'
```

**Expected response (ETD field found):**
```json
{
  "message": "Print job queued",
  "runId": "RUN-1720000000000",
  "etdField": "RequiredDate"
}
```

**Expected response (ETD field not found yet):**
```json
{
  "message": "Webhook received — ETD field not yet identified",
  "action": "Check Firestore cin7FieldDiscovery collection to inspect all available fields",
  "dateFieldsFound": { ... }
}
```

**Check Firestore:** Go to Firebase console → Firestore → `labelRuns` collection — you should see a new document for this run with all the steps logged.

---

### Test 4 — Firestore → Bridge Connection

**Goal**: Confirm the office PC bridge picks up a queued job from Firestore.

1. Make sure the bridge agent is running on the office PC (`node bridge-agent.js`)
2. In Firebase console → Firestore → `printQueue`, manually add a test document:

```
Collection: printQueue
Document ID: TEST-001
Fields:
  status: "queued"   (string)
  runId: "TEST-001"  (string)
  orderRef: "TEST"   (string)
  dymoXml: ""        (string — leave blank for this test)
  createdAt: (click the timestamp button)
  attempts: 0        (number)
```

3. Watch the bridge agent terminal on the office PC

**Pass**: You see `Processing job TEST-001` in the terminal within 5 seconds
**Fail**: Check the bridge terminal for error messages

---

### Test 5 — Full Print Test

**Goal**: Confirm a label actually prints on the DYMO 5XL.

1. Make sure DYMO Connect is open and the DYMO 5XL shows as ready
2. Make sure the bridge agent is running
3. Send the test webhook (Test 3 above) with a real order that has an ETD date set
4. Watch the bridge terminal

**Pass**: You see `✓ Job RUN-XXX printed successfully` and a label prints
**Fail**: See troubleshooting below

---

### Test 6 — Live Cin7 Trigger

**Goal**: Confirm the full end-to-end works from Cin7 itself.

1. Open any order in Cin7 Omni
2. Set or change the ETD / delivery date field
3. Save the order
4. Within a few seconds, the bridge terminal should show a job being processed
5. A label should print

---

## PART 6 — Troubleshooting

| Problem | What to check |
|---|---|
| **Bridge shows `✗ Firestore connection FAILED`** | Open `.env` — check `FIREBASE_PRIVATE_KEY` has the `\n` characters as literal text, not actual newlines. The key should be one long line in `.env`. |
| **Webhook returns 401 Unauthorized** | Check `WEBHOOK_SECRET` in Vercel matches the header value you're sending |
| **Webhook returns 502** | Check `CIN7_API_KEY`, `CIN7_API_USERNAME`, `CIN7_BASE_URL` in Vercel are correct |
| **Jobs stuck in `queued` state** | Bridge agent not running on office PC — open Command Prompt and run `node bridge-agent.js` |
| **Bridge picks up job but print fails** | DYMO Connect not open — open it and confirm printer shows as Ready |
| **DYMO not detected** | Set `DYMO_PRINTER_NAME` in `.env` to the exact printer name shown in DYMO Connect |
| **`DymoPrint.exe not found`** | DYMO Connect not installed, or installed in a different path — set `DYMO_CLI_PATH` in `.env` |
| **ETD field shows `discovery` status** | ETD field not found — run Test 2 (field discovery) to find the correct field name, then set `ETD_FIELD_NAME` in Vercel |
| **Webhook fires but no job in printQueue** | Check `labelRuns` in Firestore for the run — look at the `steps` array for which step failed |

---

## PART 7 — After Field Discovery

Once you know the ETD field name from Test 2:

1. Go to **Vercel → Settings → Environment Variables**
2. Add: `ETD_FIELD_NAME` = `RequiredDate` (or whatever field name was found)
3. Redeploy (Vercel picks up env var changes automatically on next deploy)

After that, the system will use that field name directly and skip the scanning step, making it faster and more reliable.
