// SNIPCART WEBHOOK — Netlify Function
// Replaces: api/snipcart-webhook (Azure Function)

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method not allowed' };

  try {
    const payload = JSON.parse(event.body || '{}');
    const { eventName, content } = payload;
    console.log(\`[snipcart] Event: \${eventName}\`, JSON.stringify(content || {}).slice(0, 200));

    if (eventName === 'order.completed') {
      const { items, billingAddress, invoiceNumber, total } = content || {};
      console.log(\`[snipcart] Order \${invoiceNumber}: $\${total} from \${billingAddress?.name}\`);

      // Forward to Printful if API key configured
      if (process.env.PRINTFUL_API_KEY && items?.length) {
        try {
          const orderRes = await fetch('https://api.printful.com/orders', {
            method: 'POST',
            headers: { Authorization: \`Bearer \${process.env.PRINTFUL_API_KEY}\`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: {
                name: billingAddress?.name,
                address1: billingAddress?.address1,
                city: billingAddress?.city,
                state_code: billingAddress?.province,
                country_code: billingAddress?.country,
                zip: billingAddress?.postalCode
              },
              items: items.map(i => ({
                sync_variant_id: i.customFields?.find(f => f.name === 'printful_variant_id')?.value,
                quantity: i.quantity
              })).filter(i => i.sync_variant_id)
            })
          });
          const orderData = await orderRes.json();
          console.log(\`[snipcart] Printful order created: \${orderData?.result?.id}\`);
        } catch (printfulErr) {
          console.error('[snipcart] Printful error:', printfulErr.message);
        }
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error('[snipcart-webhook] Error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
