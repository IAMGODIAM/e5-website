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
        const { name, email, subject, message } = req.body || {};

        if (!name || !email || !message) {
            context.res = {
                status: 400,
                headers,
                body: JSON.stringify({ error: 'Please fill in all required fields.' })
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

        // Forward to Formspree (if configured) or log
        const formspreeId = process.env.FORMSPREE_FORM_ID;
        
        if (formspreeId) {
            // Send via Formspree API
            const postData = JSON.stringify({ name, email, subject: subject || 'Website Inquiry', message, _replyto: email });
            
            const result = await new Promise((resolve, reject) => {
                const options = {
                    hostname: 'formspree.io',
                    path: '/f/' + formspreeId,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
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
            
            if (result.status >= 200 && result.status < 300) {
                context.res = {
                    status: 200,
                    headers,
                    body: JSON.stringify({ success: true, message: 'Message sent successfully.' })
                };
            } else {
                throw new Error('Formspree returned status ' + result.status);
            }
        } else {
            // Fallback: log the submission (will appear in Azure Function logs)
            context.log('CONTACT FORM SUBMISSION:');
            context.log('Name:', name);
            context.log('Email:', email);
            context.log('Subject:', subject || 'Website Inquiry');
            context.log('Message:', message);
            
            context.res = {
                status: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Message received. We will be in touch shortly.' })
            };
        }

    } catch (err) {
        context.log.error('Contact form error:', err.message);
        context.res = {
            status: 500,
            headers,
            body: JSON.stringify({
                error: 'Unable to send message. Please email hermes@e5enclave.com directly.'
            })
        };
    }
};
