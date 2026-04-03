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

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            context.res = {
                status: 400,
                headers,
                body: JSON.stringify({ error: 'Please provide a valid email address.' })
            };
            return;
        }

        // HubSpot Contact API — create or update contact
        const hubspotApiKey = process.env.HUBSPOT_API_KEY;
        const hubspotPortalId = process.env.HUBSPOT_PORTAL_ID;

        if (hubspotApiKey) {
            // Use HubSpot Contacts API v3 — create or update
            const postData = JSON.stringify({
                properties: {
                    email: email,
                    lifecyclestage: 'subscriber',
                    hs_lead_status: 'NEW',
                    e5_newsletter: 'true',
                    e5_source: 'blog_newsletter_signup'
                }
            });

            const result = await new Promise((resolve, reject) => {
                const options = {
                    hostname: 'api.hubapi.com',
                    path: '/crm/v3/objects/contacts',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + hubspotApiKey,
                        'Content-Length': Buffer.byteLength(postData)
                    }
                };

                const request = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => resolve({ status: res.statusCode, data }));
                });

                request.on('error', reject);
                request.write(postData);
                request.end();
            });

            if (result.status === 409) {
                // Contact already exists — update them
                context.log('Contact exists, updating:', email);
                const updateData = JSON.stringify({
                    properties: {
                        e5_newsletter: 'true',
                        e5_source: 'blog_newsletter_signup'
                    }
                });

                await new Promise((resolve, reject) => {
                    const updateOptions = {
                        hostname: 'api.hubapi.com',
                        path: `/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`,
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + hubspotApiKey,
                            'Content-Length': Buffer.byteLength(updateData)
                        }
                    };

                    const request = https.request(updateOptions, (res) => {
                        let data = '';
                        res.on('data', (chunk) => data += chunk);
                        res.on('end', () => resolve({ status: res.statusCode, data }));
                    });

                    request.on('error', reject);
                    request.write(updateData);
                    request.end();
                });
            } else if (result.status >= 300) {
                context.log.error('HubSpot error:', result.status, result.data);
                throw new Error('HubSpot returned status ' + result.status);
            }

            context.log('Newsletter signup:', email, '-> HubSpot OK');
            context.res = {
                status: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Welcome to the Enclave.' })
            };
        } else {
            // No HubSpot key — log and succeed (don't break UX)
            context.log('NEWSLETTER SIGNUP (no HubSpot configured):', email);
            context.res = {
                status: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Signup received.' })
            };
        }

    } catch (err) {
        context.log.error('Newsletter error:', err.message);
        context.res = {
            status: 500,
            headers,
            body: JSON.stringify({
                error: 'Signup failed. Please try again or email info@e5enclave.com.'
            })
        };
    }
};
