// CONTACT FORM HANDLER — Cloudflare Pages Function
// Routes: coalition apply, contact, newsletter signup, all form POSTs
// Notifications → accounts@e5enclave.com via M365 Graph

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://e5enclave.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await request.json();
    const { name, email, subject, message, track, pillar, organization, role, source } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Valid email required.' }), { status: 400, headers });
    }

    const subjectLine = subject || 'Website Form Submission';
    const isNewsletter = subjectLine.toLowerCase().includes('newsletter');

    const emailBody = isNewsletter
      ? `New newsletter signup: ${email}\nName: ${name || '—'}\nSource: ${source || 'site'}`
      : `NEW FORM SUBMISSION — E5 Enclave Website\nSubject: ${subjectLine}\nName: ${name || '(not provided)'}\nEmail: ${email}\nOrganization: ${organization || '—'}\nRole: ${role || '—'}\nTrack: ${track || '—'}\nPillar: ${pillar || '—'}\nMessage:\n${message || '(no message)'}\n---\nSubmitted via e5enclave.com`;

    let sent = false;
    if (env.M365_CLIENT_ID && env.M365_CLIENT_SECRET && env.M365_TENANT_ID) {
      try {
        const tokenRes = await fetch(`https://login.microsoftonline.com/${env.M365_TENANT_ID}/oauth2/v2.0/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: env.M365_CLIENT_ID,
            client_secret: env.M365_CLIENT_SECRET,
            scope: 'https://graph.microsoft.com/.default',
            grant_type: 'client_credentials'
          })
        });
        const { access_token } = await tokenRes.json();
        await fetch('https://graph.microsoft.com/v1.0/users/accounts@e5enclave.com/sendMail', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: {
              subject: `[E5 Site] ${subjectLine}`,
              body: { contentType: 'Text', content: emailBody },
              toRecipients: [{ emailAddress: { address: 'accounts@e5enclave.com' } }],
              replyTo: email ? [{ emailAddress: { address: email, name: name || email } }] : []
            },
            saveToSentItems: false
          })
        });
        sent = true;
      } catch (graphErr) {
        console.error('[contact] Graph API error:', graphErr.message);
      }
    }

    // Structured log (Cloudflare Observability)
    console.log(JSON.stringify({
      type: 'form_submission', email, name, subject: subjectLine,
      organization, track, pillar, role, source,
      sent_via_m365: sent, timestamp: new Date().toISOString()
    }));

    return new Response(JSON.stringify({ success: true, message: 'Received. Thank you — the center holds.' }), { status: 200, headers });

  } catch (err) {
    console.error('[contact] Error:', err.message);
    return new Response(JSON.stringify({ error: 'Submission failed. Please email accounts@e5enclave.com directly.' }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': 'https://e5enclave.com', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
