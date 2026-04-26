/**
 * label-print-service/api/discover-fields.js
 * ────────────────────────────────────────────
 * GET /discover-fields?orderRef=YOUR-ORDER-NUMBER
 *
 * Fetches a real Cin7 Omni order and returns every field it contains,
 * highlighting which ones look like dates — so you can identify the ETD field.
 *
 * Usage (paste in browser or Postman):
 *   https://your-dashboard.vercel.app/discover-fields?orderRef=SO-12345
 *
 * Environment variables required:
 *   CIN7_API_KEY
 *   CIN7_API_USERNAME  (e.g. GroveGroupScotlaUK)
 */

const CIN7_BASE = 'https://api.cin7.com/api/v1';

const ETD_CANDIDATES = [
  'RequiredShipDate', 'ShipByDate', 'ETD', 'Etd', 'DeliveryDate',
  'EstimatedDeliveryDate', 'ExpectedDeliveryDate', 'PromisedDate',
  'PlannedShipDate', 'PlannedDeliveryDate', 'DueDate', 'DispatchDate',
  'ETA', 'Eta', 'etd', 'CustomETD', 'RequiredDate',
];

function cin7Headers(apiUser, apiKey) {
  const creds = Buffer.from(`${apiUser}:${apiKey}`).toString('base64');
  return {
    'Authorization': `Basic ${creds}`,
    'Content-Type':  'application/json',
    'Accept':        'application/json',
  };
}

function extractDateFields(obj, prefix = '') {
  const dates = {};
  if (!obj || typeof obj !== 'object') return dates;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string' && /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/.test(v)) {
      dates[key] = v;
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(dates, extractDateFields(v, key));
    }
  }
  return dates;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });

  const apiKey  = process.env.CIN7_API_KEY;
  const apiUser = process.env.CIN7_API_USERNAME;

  if (!apiKey || !apiUser) {
    return res.status(500).json({
      error: 'CIN7_API_KEY and CIN7_API_USERNAME not set in Vercel environment variables',
    });
  }

  const { orderRef, orderId } = req.query;
  if (!orderRef && !orderId) {
    return res.status(400).json({
      error: 'Provide ?orderRef=YOUR-ORDER-REF or ?orderId=123',
      example: '/discover-fields?orderRef=SO-12345',
    });
  }

  const headers = cin7Headers(apiUser, apiKey);

  try {
    // Fetch the order from Cin7 Omni
    let order;
    if (orderId) {
      const r = await fetch(`${CIN7_BASE}/SalesOrders/${orderId}`, { headers });
      const d = await r.json();
      order = Array.isArray(d) ? d[0] : (d?.Data ?? d);
    } else {
      const r = await fetch(
        `${CIN7_BASE}/SalesOrders?where=reference="${encodeURIComponent(orderRef)}"&limit=1`,
        { headers }
      );
      const d = await r.json();
      order = Array.isArray(d) ? d[0] : (d?.Data?.[0] ?? d?.[0] ?? d);
    }

    if (!order || (!order.Id && !order.ID)) {
      return res.status(404).json({
        error: 'Order not found in Cin7 Omni',
        hint: 'Check the order reference is correct and the API credentials have read permission on Sales Orders',
      });
    }

    // Find all date fields
    const dateFields = extractDateFields(order);

    // Check which ETD candidates have values
    const etdCandidates = {};
    for (const field of ETD_CANDIDATES) {
      const val = order[field] ?? order.AdditionalAttributes?.[field];
      if (val !== undefined && val !== null && val !== '') {
        etdCandidates[field] = { value: val };
      }
    }

    // Recommendation
    let recommendation;
    if (Object.keys(etdCandidates).length > 0) {
      const best = Object.keys(etdCandidates)[0];
      recommendation = {
        fieldName: best,
        currentValue: etdCandidates[best].value,
        action: `Set ETD_FIELD_NAME=${best} in your Vercel environment variables`,
      };
    } else if (Object.keys(dateFields).length > 0) {
      recommendation = {
        message: 'No standard ETD field names matched. Review the dateFields list below and identify which one is your ETD date, then set ETD_FIELD_NAME in Vercel.',
        hint: 'Look for a field named something like DeliveryDate, ShipByDate, or RequiredDate',
      };
    } else {
      recommendation = {
        message: 'No date fields found. This order may not have a delivery date set yet. Try an order that has one.',
      };
    }

    return res.status(200).json({
      orderReference:    order.Reference ?? order.OrderNumber ?? orderRef,
      orderId:           order.Id ?? order.ID,
      recommendation,
      etdCandidates,
      dateFields,
      customFields:      order.AdditionalAttributes ?? {},
      allTopLevelFields: Object.keys(order),
    });

  } catch (err) {
    console.error('[discover-fields]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
