/**
 * label-print-service/api/sales-orders.js
 * ─────────────────────────────────────────
 * GET /api/sales-orders
 *
 * Fetches open sales orders from Cin7 and filters to only those
 * that do not have an ETD (Estimated Time of Delivery) date set.
 *
 * The ETD field name is configured via ETD_FIELD_NAME env var.
 * If ETD_FIELD_NAME is blank, returns all open orders (so you can
 * browse them while you confirm the field name).
 *
 * Cron schedule: Mon-Fri 7:30am UTC
 * STATUS: INACTIVE — to activate, uncomment the cron entry in vercel.json
 *
 * Environment variables required:
 *   CIN7_API_KEY
 *   CIN7_API_USERNAME
 *   CIN7_BASE_URL
 *   ETD_FIELD_NAME  (optional — the field in Cin7 that holds the ETD date)
 */

function cin7Headers() {
  return {
    'api-auth-accountid':        process.env.CIN7_API_USERNAME ?? '',
    'api-auth-applicationkey':   process.env.CIN7_API_KEY ?? '',
    'Content-Type': 'application/json',
  };
}

function formatLines(order) {
  const lines = order.SaleOrderLines ?? order.Lines ?? [];
  return lines.map(l => ({
    productName: l.ProductName ?? l.Name ?? l.SKU ?? 'Unknown product',
    qty: l.Quantity ?? l.Qty ?? 1,
    sku: l.SKU ?? '',
  }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const base       = process.env.CIN7_BASE_URL ?? 'https://inventory.dearsystems.com/ExternalApi/v2';
  const etdField   = process.env.ETD_FIELD_NAME ?? '';
  const apiKey     = process.env.CIN7_API_KEY;
  const apiUser    = process.env.CIN7_API_USERNAME;

  if (!apiKey || !apiUser) {
    return res.status(200).json({
      success: false,
      error: 'Cin7 credentials not configured. Set CIN7_API_KEY and CIN7_API_USERNAME in Vercel environment variables.',
      orders: [],
    });
  }

  try {
    // Fetch open sales orders from Cin7
    // Status=AUTHORISED gets approved/confirmed orders
    // Limit to 250 most recent
    const url = `${base}/sale?Status=AUTHORISED&limit=250&page=1`;
    console.log(`[sales-orders] Fetching from Cin7: ${url}`);

    const cin7Res = await fetch(url, { headers: cin7Headers() });

    if (!cin7Res.ok) {
      const errText = await cin7Res.text().catch(() => '');
      throw new Error(`Cin7 API error: ${cin7Res.status} ${cin7Res.statusText} — ${errText.slice(0, 200)}`);
    }

    const data = await cin7Res.json();
    const allOrders = data?.SaleList ?? data?.Sale ?? [];

    console.log(`[sales-orders] Fetched ${allOrders.length} orders from Cin7`);

    // Filter to orders missing ETD date
    let missingEtd = allOrders;

    if (etdField) {
      missingEtd = allOrders.filter(order => {
        const etdValue = order[etdField];
        return !etdValue || etdValue === '' || etdValue === null;
      });
      console.log(`[sales-orders] ${missingEtd.length} orders missing ETD (field: ${etdField})`);
    } else {
      console.log('[sales-orders] ETD_FIELD_NAME not set — returning all open orders');
    }

    // Map to a clean format for the dashboard
    const orders = missingEtd.map(order => ({
      id:           order.ID ?? order.SaleID ?? order.id ?? '',
      orderNumber:  order.OrderNumber ?? order.SaleOrderNumber ?? order.Number ?? '',
      customerName: order.Customer ?? order.CustomerName ?? order.ShipTo?.Contact ?? 'Unknown',
      orderDate:    order.SaleOrderDate ?? order.Date ?? order.CreatedDate ?? '',
      status:       order.Status ?? '',
      totalAmount:  order.TotalAmount ?? order.Total ?? null,
      currency:     order.Currency ?? 'GBP',
      lines:        formatLines(order),
    })).filter(o => o.id && o.orderNumber); // Remove any malformed records

    return res.status(200).json({
      success: true,
      count: orders.length,
      total: allOrders.length,
      etdField: etdField || null,
      etdFieldNote: etdField ? null : 'ETD_FIELD_NAME not set — showing all open orders',
      orders,
    });

  } catch (err) {
    console.error('[sales-orders] Error:', err.message);
    return res.status(200).json({
      success: false,
      error: err.message,
      orders: [],
    });
  }
}
