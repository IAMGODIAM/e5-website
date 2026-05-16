// SHIPPING RATES PROXY — Netlify Function
// Replaces: api/shipping-rates (Azure Function)
// Proxies Printful shipping API to Snipcart format

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const body = JSON.parse(event.body || '{}');
    const printfulKey = process.env.PRINTFUL_API_KEY;

    if (!printfulKey) {
      return { statusCode: 503, headers, body: JSON.stringify({ error: 'Shipping rates temporarily unavailable.' }) };
    }

    const res = await fetch('https://api.printful.com/shipping/rates', {
      method: 'POST',
      headers: { Authorization: \`Bearer \${printfulKey}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    return { statusCode: res.status, headers, body: JSON.stringify(data) };

  } catch (err) {
    console.error('[shipping-rates] Error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
