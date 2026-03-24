# Grove Bedding Dashboard

A modern React + TypeScript + Vite logistics operations dashboard for Grove Bedding. Manages inventory, automates label printing via DYMO 5XL, places orders with Birlea, and tracks dispatch operations.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Connections & Integrations

This dashboard connects to three external systems. Each requires configuration before the relevant features go live.

### 1. Firebase Firestore (Live Database)

The dashboard is built to sync with Firebase Firestore for real-time inventory, order history, and label data. Without Firebase connected, the app runs on built-in sample data.

#### Step 1 — Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** and follow the setup wizard
3. Once created, go to **Project Settings → General → Your apps**
4. Click **Add app → Web** and register the app
5. Firebase will show you a config object like this:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

#### Step 2 — Add Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase values:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### Step 3 — Enable Firestore

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** for development (add security rules before going live)
4. Select a region close to your location

#### Step 4 — Firestore Collections

The dashboard expects these collections in Firestore:

| Collection | Purpose |
|---|---|
| `inventory` | Stock items with SKU, quantity, reorder levels |
| `orders` | Birlea orders placed via the Orders page |
| `labels` | Generated shipping labels and their verification status |
| `dispatches` | Active and completed dispatch operations |
| `automationLogs` | Automation event log entries |

The Firebase config lives in `src/lib/firebase.ts`. Replace the sample data calls in each section component with Firestore `onSnapshot` listeners to enable live data.

---

### 2. Make.com Webhook (Birlea Order Submission)

When you press **Send Order** on the Orders page, the order data is POSTed to a Make.com webhook which forwards it to Birlea.

**Current Webhook URL (already configured):**
```
https://hook.eu1.make.com/ekeigx4rsyy6ur1p0pjyn46emny84hed
```

This is set in `src/sections/BirleaOrders.tsx` as `WEBHOOK_URL`. To update it:

1. Log in to [Make.com](https://www.make.com)
2. Open your scenario that handles Birlea orders
3. Copy the webhook URL from the Webhooks module
4. Replace `WEBHOOK_URL` in `BirleaOrders.tsx`

**Payload sent to the webhook:**

```json
{
  "birleaCustomerNumber": "BIR-12345",
  "orderType": "Standard",
  "orderNumber": "ORD-123456",
  "name": "Recipient Name",
  "address1": "Street Address",
  "address2": "Unit / Building",
  "town": "Town",
  "region": "Region",
  "postCode": "AB1 2CD",
  "buyerPhoneNumber": "01234 567890",
  "email": "orders@birlea.com",
  "items": [
    { "item": "Memory Foam Mattress", "quantity": 10 }
  ]
}
```

**Email routing (auto-populated based on Order Type):**

| Order Type | Email |
|---|---|
| Standard (Store / Warehouse) | orders@birlea.com |
| Next Day (Own Courier) | nextday@birlea.com |
| Birlea Direct Home Delivery | homedelivery@birlea.com |

---

### 3. DYMO 5XL Printer (Label Printing)

The Label Management page generates and manages shipping labels for the DYMO LabelWriter 5XL printer.

#### Requirements

- **DYMO Connect software** must be installed on the machine running the dashboard
  - Download from [https://www.dymo.com/support](https://www.dymo.com/support)
- The DYMO 5XL must be **connected via USB** and powered on
- DYMO Connect exposes a **local REST API** on `http://localhost:41951` that the dashboard can call to send print jobs

#### How Printing Works

1. An order is placed via the **Orders** page → the webhook is called → a label is auto-generated
2. A **notification** appears in the bottom-right corner on every page alerting staff that a label needs review
3. A staff member opens **Label Management**, reviews the delivery details, and clicks **Verify & Approve**
4. Once verified, the **Print to DYMO 5XL** button becomes active
5. Clicking Print sends the label data to the DYMO Connect local API

#### Connecting to DYMO Connect API

The print button in `src/sections/LabelManagement.tsx` (in the `onPrint` handler called from `App.tsx`) can be extended to POST to the DYMO Connect API:

```ts
// Example: send label to DYMO Connect
const printToDymo = async (label: LabelData) => {
  const labelXml = buildDymoLabelXml(label); // build DYMO label XML
  await fetch('http://localhost:41951/DYMO/DLS/Printing/PrintLabel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      printerName: 'DYMO LabelWriter 5XL',
      labelXml,
      labelSetXml: '',
    }),
  });
};
```

The DYMO label XML format and full API documentation is available in the DYMO Developer SDK, downloadable from the DYMO support site.

---

## Dashboard Sections

| Section | Description |
|---|---|
| **Overview** | System status, today's orders, active automations, workflow tracker |
| **Inventory** | Stock levels, category charts, weekly movement, item reorder actions |
| **Automation** | Live automation event log, failed workflow details, retry controls |
| **Dispatch** | Kanban board for active and completed dispatch operations |
| **Labels** | DYMO 5XL label queue — review, edit, verify, and print shipping labels |
| **Orders** | Place new orders with Birlea — low stock items pre-loaded automatically |

---

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS** — styling
- **GSAP** — animations
- **Recharts** — inventory charts
- **shadcn/ui** — accessible UI components
- **Firebase Firestore** — real-time database (requires configuration)
- **Make.com** — order automation webhook

---

## Project Structure

```
src/
├── sections/
│   ├── Header.tsx           # Fixed top header with printer status
│   ├── TopNavigation.tsx    # Section navigation bar
│   ├── DashboardHero.tsx    # Overview page
│   ├── StockManagement.tsx  # Inventory page
│   ├── AutomationStream.tsx # Automation logs page
│   ├── DispatchTracking.tsx # Dispatch kanban page
│   ├── LabelManagement.tsx  # Label management page (new)
│   └── BirleaOrders.tsx     # Birlea order form page (new)
├── lib/
│   └── firebase.ts          # Firebase configuration
├── components/ui/           # shadcn/ui components
├── App.tsx                  # Root — routing, shared label state, notifications
└── main.tsx                 # Entry point
```

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firestore project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

Copy `.env.example` to `.env.local` and populate these before running in production.
