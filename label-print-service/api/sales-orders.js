/**
 * label-print-service/api/sales-orders.js
 * ─────────────────────────────────────────
 * GET /api/sales-orders
 *
 * Fetches open sales orders from Cin7 Omni and filters to only those
 * that do not have an ETD (Estimated Time of Delivery) date set.
 *
 * Cin7 Omni uses Basic Auth: username + API key
 * Base URL: https://api.cin7.com/api/v1
 *
 * Environment variables required:
 *   CIN7_API_KEY       — the API connection key from Cin7 Omni
 *   CIN7_API_USERNAME  — the API username (e.g. GroveGroupScotlaUK)
 *   ETD_FIELD_NAME     — (optional) field name in Cin7 that holds ETD date
 */

const CIN7_BASE = 'https://api.cin7.com/api/v1';

function cin7Headers(apiUser, apiKey) {
  const credentials = Buffer.from(`${apiUser}:${apiKey}`).toString('base64');
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type':  'application/json',
    'Accept':        'application/json',
  };
}

function formatLines(order) {
  const lines = order.LineItems ?? order.Lines ?? order.SaleOrderLines ?? [];
  return lines.map(l => ({
    productName: l.Name ?? l.ProductName ?? l.Description ?? l.SKU ?? 'Unknown product',
    qty:         l.Quantity ?? l.Qty ?? 1,
    sku:         l.SKU ?? l.Code ?? '',
  }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey  = process.env.CIN7_API_KEY;
  const apiUser = process.env.CIN7_API_USERNAME;
  const etdField = process.env.ETD_FIELD_NAME ?? '';

  if (!apiKey || !apiUser) {
    return res.status(200).json({
      success: false,
      error: 'Cin7 credentials not configured. Set CIN7_API_KEY and CIN7_API_USERNAME in Vercel.',
      orders: [],
    });
  }

  try {
    const headers = cin7Headers(apiUser, apiKey);

    // Cin7 Omni endpoint — fetch authorised/open sales orders
    // stage=Placed gets confirmed orders awaiting fulfilment
    const url = `${CIN7_BASE}/SalesOrders?stage=Authorised&limit=250&page=1`;
    console.log(`[sales-orders] Fetching from Cin7 Omni: ${url}`);

    const cin7Res = await fetch(url, { headers });

    if (!cin7Res.ok) {
      const errText = await cin7Res.text().catch(() => '');
      throw new Error(`Cin7 Omni API error: ${cin7Res.status} ${cin7Res.statusText} — ${errText.slice(0, 300)}`);
    }

    const data = await cin7Res.json();

    // Cin7 Omni returns array directly or wrapped in Data
    const allOrders = Array.isArray(data) ? data : (data?.Data ?? data?.SalesOrders ?? []);

    console.log(`[sales-orders] Fetched ${allOrders.length} orders from Cin7 Omni`);

    // Filter to orders missing ETD if field name configured
    let filtered = allOrders;
    if (etdField) {
      filtered = allOrders.filter(order => {
        const val = order[etdField] ?? order.AdditionalAttributes?.[etdField];
        return !val || val === '' || val === null;
      });
      console.log(`[sales-orders] ${filtered.length} orders missing ETD (field: ${etdField})`);
    }

    // Map to clean format for the dashboard
    const orders = filtered.map(order => ({
      id:           String(order.Id ?? order.ID ?? order.SalesOrderId ?? ''),
      orderNumber:  String(order.Reference ?? order.OrderNumber ?? order.SalesOrderNumber ?? ''),
      customerName: order.MemberEmail ?? order.BillingAddress?.Name ?? order.Company ?? order.MemberId ?? 'Unknown',
      orderDate:    order.CreatedDate ?? order.OrderDate ?? order.Date ?? '',
      status:       order.Stage ?? order.Status ?? '',
      totalAmount:  order.Total ?? order.TotalAmount ?? null,
      currency:     order.CurrencyCode ?? 'GBP',
      lines:        formatLines(order),
    })).filter(o => o.id && o.orderNumber);

    return res.status(200).json({
      success:      true,
      count:        orders.length,
      total:        allOrders.length,
      etdField:     etdField || null,
      etdFieldNote: etdField ? null : 'ETD_FIELD_NAME not set — showing all authorised orders',
      orders,
    });

  } catch (err) {
    console.error('[sales-orders] Error:', err.message);
    return res.status(200).json({
      success: false,
      error:   err.message,
      orders:  [],
    });
  }
}
