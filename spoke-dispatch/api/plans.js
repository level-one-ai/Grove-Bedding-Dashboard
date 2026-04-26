/**
 * spoke-dispatch/api/plans.js
 * ────────────────────────────
 * GET /api/spoke-plans
 *
 * Fetches all delivery plans (routes) from Spoke Dispatch.
 * Returns a list of plans with their date, driver, stop count and status.
 *
 * Spoke Dispatch API base: https://api.getcircuit.com/public/v0.2b
 * Auth: Bearer token (API key from Settings → Integrations → API)
 *
 * Environment variables required:
 *   SPOKE_API_KEY  — generated from Spoke Dispatch settings
 */

const SPOKE_BASE = 'https://api.getcircuit.com/public/v0.2b';

function spokeHeaders() {
  return {
    'Authorization': `Bearer ${process.env.SPOKE_API_KEY}`,
    'Content-Type':  'application/json',
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Use GET' });

  const apiKey = process.env.SPOKE_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      success: false,
      error:   'SPOKE_API_KEY not configured in Vercel environment variables',
      plans:   [],
    });
  }

  try {
    // Fetch plans — optionally filter by date range
    // Default: plans from today onwards
    const today = new Date().toISOString().split('T')[0];
    const url   = `${SPOKE_BASE}/plans?filter.startsGte=${today}&maxPageSize=50`;

    const r = await fetch(url, { headers: spokeHeaders() });

    if (r.status === 401) {
      return res.status(200).json({
        success: false,
        error:   'Invalid Spoke API key — check SPOKE_API_KEY in Vercel',
        plans:   [],
      });
    }

    if (!r.ok) {
      throw new Error(`Spoke API error: ${r.status} ${r.statusText}`);
    }

    const data  = await r.json();
    const plans = data.plans ?? data.results ?? data ?? [];

    // Map to clean format for dashboard
    const mapped = plans.map(plan => ({
      id:         plan.id,
      title:      plan.title ?? 'Unnamed Plan',
      date:       plan.starts?.substring(0, 10) ?? null,
      startTime:  plan.starts ?? null,
      status:     plan.distributed ? 'distributed' : plan.optimized ? 'optimized' : 'draft',
      stopCount:  plan.stopCount  ?? 0,
      routeCount: plan.routeCount ?? 0,
      drivers:    plan.drivers    ?? [],
      depot:      plan.depot?.name ?? null,
    }));

    // Sort by date ascending
    mapped.sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));

    return res.status(200).json({ success: true, count: mapped.length, plans: mapped });

  } catch (err) {
    console.error('[spoke-plans]', err.message);
    return res.status(200).json({ success: false, error: err.message, plans: [] });
  }
}
