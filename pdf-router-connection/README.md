# PDF Router Connection

This folder connects the Grove Bedding Dashboard to the standalone PDF Router.

## How it works

The PDF Router writes status updates to its own Firebase Firestore database.
The dashboard reads from that same database directly via the Firebase client SDK
using the VITE_PDF_ROUTER_FIREBASE_* environment variables.

This `router-status.cjs` API endpoint is a server-side fallback that reads the
same data using the Firebase Admin SDK, in case the client-side Firestore
connection is not available.

## Environment variables needed on Vercel (Dashboard project)

### For direct client-side Firestore connection (used by the dashboard UI):
- VITE_PDF_ROUTER_FIREBASE_PROJECT_ID
- VITE_PDF_ROUTER_FIREBASE_API_KEY
- VITE_PDF_ROUTER_FIREBASE_AUTH_DOMAIN

### For server-side fallback API (router-status.cjs):
- PDF_ROUTER_FIREBASE_PROJECT_ID
- PDF_ROUTER_FIREBASE_CLIENT_EMAIL
- PDF_ROUTER_FIREBASE_PRIVATE_KEY

## The PDF Router's Firebase project

The PDF Router uses its own Firebase project (grove-pdf-router or similar).
Get the credentials from:
Firebase Console → PDF Router project → Project Settings → Service Accounts → Generate new private key
