// NEWSLETTER HANDLER — Netlify Function
// Replaces: api/newsletter (Azure Function)

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
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Valid email required.' }) };
    }

    // Log signup — Netlify captures all logs; also try M365 notification
    console.log(\`[newsletter] Signup: \${email} | source: \${source || 'site'} | name: \${name || '—'}\`);

    // Notify contact@e5enclave.com via Graph if configured
    if (process.env.M365_CLIENT_ID && process.env.M365_CLIENT_SECRET && process.env.M365_TENANT_ID) {
      try {
        const tokenRes = await fetch(\`https://login.microsoftonline.com/\${process.env.M365_TENANT_ID}/oauth2/v2.0/token\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.M365_CLIENT_ID,
            client_secret: process.env.M365_CLIENT_SECRET,
            scope: 'https://graph.microsoft.com/.default',
            grant_type: 'client_credentials'
          })
        });
        const { access_token } = await tokenRes.json();
        await fetch('https://graph.microsoft.com/v1.0/users/contact@e5enclave.com/sendMail', {
          method: 'POST',
          headers: { Authorization: \`Bearer \${access_token}\`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: {
              subject: \`[E5 Newsletter] New signup: \${email}\`,
              body: { contentType: 'Text', content: \`New newsletter signup\nEmail: \${email}\nName: \${name || '—'}\nSource: \${source || 'site'}\` },
              toRecipients: [{ emailAddress: { address: 'contact@e5enclave.com' } }]
            },
            saveToSentItems: false
          })
        });
      } catch (e) { console.error('[newsletter] Graph error:', e.message); }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('[newsletter] Error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Signup failed.' }) };
  }
};
