/**
 * spoke-dispatch/api/stops.js
 * ────────────────────────────
 * GET /api/spoke-stops?planId=plans/PLAN_ID
 *
 * Fetches all stops (customer deliveries) for a specific plan.
 * Returns each stop with recipient name, address, order items and delivery notes.
 *
 * Environment variables required:
 *   SPOKE_API_KEY
 */

const SPOKE_BASE = 'https://api.getcircuit.com/public/v0.2b';

function spokeHeaders() {
  return {
    'Authorization': `Bearer ${process.env.SPOKE_API_KEY}`,
    'Content-Type':  'application/json',
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Use GET' });

  const apiKey = process.env.SPOKE_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ success: false, error: 'SPOKE_API_KEY not set', stops: [] });
  }

  const { planId } = req.query;
  if (!planId) {
    return res.status(400).json({ success: false, error: 'planId query param required', stops: [] });
  }

  try {
    // planId is the full serialized ID e.g. "plans/abc123"
    const url = `${SPOKE_BASE}/${planId}/stops?maxPageSize=100`;
    const r   = await fetch(url, { headers: spokeHeaders() });

    if (!r.ok) {
      throw new Error(`Spoke API error: ${r.status} ${r.statusText}`);
    }

    const data  = await r.json();
    const stops = data.stops ?? data.results ?? data ?? [];

    // Map to clean format for the dashboard panel
    const mapped = stops.map((stop, idx) => ({
      id:            stop.id,
      position:      stop.orderPosition ?? idx + 1,
      status:        stop.stopState ?? 'pending',

      // Recipient details
      recipientName:  stop.recipient?.name    ?? stop.address?.name ?? 'Unknown',
      recipientPhone: stop.recipient?.phone   ?? null,
      recipientEmail: stop.recipient?.email   ?? null,
      recipientNotes: stop.recipient?.notes   ?? null,

      // Delivery address
      address:        stop.address?.addressLineOne ?? '',
      address2:       stop.address?.addressLineTwo ?? '',
      city:           stop.address?.city           ?? '',
      postcode:       stop.address?.postCode       ?? '',
      country:        stop.address?.countryCode    ?? 'GB',
      coordinates: stop.address?.location ? {
        lat: stop.address.location.lat,
        lng: stop.address.location.lng,
      } : null,

      // Delivery details
      packageCount:   stop.packageCount ?? 1,
      orderInfo:      stop.orderInfo    ?? null,
      notes:          stop.notes        ?? null,

      // Custom fields — where Cin7 order details may be stored
      customFields:   stop.customProperties ?? {},

      // Timing
      scheduledAt:    stop.plannedArrivalAt  ?? null,
      completedAt:    stop.activity?.completedAt ?? null,
      route:          stop.route ?? null,
    }));

    // Sort by route position
    mapped.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    return res.status(200).json({ success: true, count: mapped.length, planId, stops: mapped });

  } catch (err) {
    console.error('[spoke-stops]', err.message);
    return res.status(200).json({ success: false, error: err.message, stops: [] });
  }
}
