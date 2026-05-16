// CONTACT FORM HANDLER — Netlify Function
// Replaces: api/contact (Azure Function)
// Handles: coalition apply, contact, newsletter signup, all form POSTs
// Env vars: M365_CLIENT_ID, M365_CLIENT_SECRET, M365_TENANT_ID (optional — falls back to fetch log)

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://e5enclave.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const { name, email, subject, message, track, pillar, organization, role } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Valid email required.' }) };
    }

    // Build submission record
    const subjectLine = subject || 'Website Form Submission';
    const isNewsletter = subjectLine.toLowerCase().includes('newsletter');
    const isCoalition = subjectLine.toLowerCase().includes('coalition');

    const emailBody = isNewsletter
      ? \`New newsletter signup: \${email}\`
      : \`
NEW FORM SUBMISSION — E5 Enclave Website
Subject: \${subjectLine}
Name: \${name || '(not provided)'}
Email: \${email}
Organization: \${organization || '—'}
Role: \${role || '—'}
Track: \${track || '—'}
Pillar: \${pillar || '—'}
Message:
\${message || '(no message)'}

---
Submitted via e5enclave.com
\`;

    // Try M365 Graph API send if env vars available
    let sent = false;
    if (process.env.M365_CLIENT_ID && process.env.M365_CLIENT_SECRET && process.env.M365_TENANT_ID) {
      try {
        // Get token
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

        // Send mail via Graph
        await fetch('https://graph.microsoft.com/v1.0/users/contact@e5enclave.com/sendMail', {
          method: 'POST',
          headers: { 'Authorization': \`Bearer \${access_token}\`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: {
              subject: \`[E5 Site] \${subjectLine}\`,
              body: { contentType: 'Text', content: emailBody },
              toRecipients: [{ emailAddress: { address: 'contact@e5enclave.com' } }],
              replyTo: email ? [{ emailAddress: { address: email, name: name || email } }] : []
            },
            saveToSentItems: false
          })
        });
        sent = true;
        console.log(\`[contact] Sent via M365 Graph: \${email} / \${subjectLine}\`);
      } catch (graphErr) {
        console.error('[contact] Graph API error:', graphErr.message);
      }
    }

    // Always log — Netlify captures all function logs
    if (!sent) {
      console.log(\`[contact] SUBMISSION (no Graph): \${JSON.stringify({ email, subject: subjectLine, name, track })}\`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Received. Thank you — the center holds.' })
    };

  } catch (err) {
    console.error('[contact] Error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Submission failed. Please email contact@e5enclave.com directly.' }) };
  }
};
