const https = require('https');

module.exports = async function (context, req) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://e5enclave.com',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (req.method === 'OPTIONS') {
        context.res = { status: 200, headers, body: '' };
        return;
    }

    try {
        const { email } = req.body || {};

        if (!email) {
            context.res = {
                status: 400,
                headers,
                body: JSON.stringify({ error: 'Email is required.' })
            };
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            context.res = {
                status: 400,
                headers,
                body: JSON.stringify({ error: 'Please provide a valid email address.' })
            };
            return;
        }

        const hubspotApiKey = process.env.HUBSPOT_API_KEY;
        const hubspotPortalId = process.env.HUBSPOT_PORTAL_ID;
        const hubspotFormId = process.env.HUBSPOT_FORM_ID;
        let hubspotOk = false;

        // Strategy 1: HubSpot Forms API (no auth needed, just portal + form ID)
        if (hubspotPortalId && hubspotFormId) {
            try {
                const formData = JSON.stringify({
                    fields: [
                        { name: 'email', value: email }
                    ],
                    context: {
                        pageUri: 'https://e5enclave.com/blog',
                        pageName: 'E5 Enclave Blog'
                    }
                });

                const result = await httpPost(
                    'api.hsforms.com',
                    `/submissions/v3/integration/submit/${hubspotPortalId}/${hubspotFormId}`,
                    formData
                );

                if (result.status < 300) {
                    hubspotOk = true;
                    context.log('Newsletter signup via Forms API:', email);
                } else {
                    context.log.warn('HubSpot Forms API error:', result.status, result.data);
                }
            } catch (e) {
                context.log.warn('HubSpot Forms API exception:', e.message);
            }
        }

        // Strategy 2: HubSpot Contacts API v3 (needs valid private app token)
        if (!hubspotOk && hubspotApiKey) {
            try {
                const contactData = JSON.stringify({
                    properties: {
                        email: email,
                        lifecyclestage: 'subscriber',
                        hs_lead_status: 'NEW'
                    }
                });

                const result = await httpRequest(
                    'api.hubapi.com',
                    '/crm/v3/objects/contacts',
                    'POST',
                    contactData,
                    { 'Authorization': 'Bearer ' + hubspotApiKey }
                );

                if (result.status === 409) {
                    // Contact exists — update
                    await httpRequest(
                        'api.hubapi.com',
                        `/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`,
                        'PATCH',
                        JSON.stringify({ properties: { lifecyclestage: 'subscriber' } }),
                        { 'Authorization': 'Bearer ' + hubspotApiKey }
                    );
                    hubspotOk = true;
                    context.log('Newsletter signup (contact updated):', email);
                } else if (result.status < 300) {
                    hubspotOk = true;
                    context.log('Newsletter signup (contact created):', email);
                } else {
                    context.log.warn('HubSpot Contacts API error:', result.status, result.data);
                }
            } catch (e) {
                context.log.warn('HubSpot Contacts API exception:', e.message);
            }
        }

        // Always succeed for the user — log what happened
        if (!hubspotOk) {
            context.log('NEWSLETTER SIGNUP (logged, HubSpot unavailable):', email);
        }

        context.res = {
            status: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Welcome to the Enclave.' })
        };

    } catch (err) {
        context.log.error('Newsletter error:', err.message);
        context.res = {
            status: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Signup received.' })
        };
    }
};

function httpPost(hostname, path, data) {
    return httpRequest(hostname, path, 'POST', data, {});
}

function httpRequest(hostname, path, method, data, extraHeaders) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                ...extraHeaders
            }
        };

        const request = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: body }));
        });

        request.on('error', reject);
        request.setTimeout(5000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
        request.write(data);
        request.end();
    });
}
