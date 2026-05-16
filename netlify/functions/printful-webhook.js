// PRINTFUL WEBHOOK — Netlify Function
// Replaces: api/printful-webhook (Azure Function)

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const payload = JSON.parse(event.body || '{}');
    const { type, data } = payload;
    console.log(\`[printful-webhook] Event: \${type}\`, JSON.stringify(data || {}).slice(0, 200));

    // Handle fulfillment events
    if (type === 'package_shipped') {
      console.log(\`[printful] Shipped: order \${data?.order?.id}, tracking: \${data?.shipment?.tracking_number}\`);
      // TODO: Email customer tracking info via M365 Graph
    }

    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error('[printful-webhook] Error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
