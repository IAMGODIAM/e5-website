// NEWSLETTER HANDLER — Netlify Function
exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://e5enclave.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  try {
    const { email, name, source } = JSON.parse(event.body || '{}');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid email address.' }) };
    }
    console.log(`[newsletter] Signup: ${email} | source: ${source || 'unknown'}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Thank you for subscribing to E5 Enclave updates.' })
    };
  } catch (err) {
    console.error('[newsletter] Error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Subscription failed. Please try again.' }) };
  }
};
