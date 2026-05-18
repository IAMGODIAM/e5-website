const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function (context, req) {
    // CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://e5enclave.com',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle preflight
    if (req.method === 'OPTIONS') {
        context.res = { status: 200, headers, body: '' };
        return;
    }

    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            context.res = {
                status: 503,
                headers,
                body: JSON.stringify({
                    error: 'Payment system is being configured. Please email hermes@e5enclave.com to arrange your donation.'
                })
            };
            return;
        }

        const { amount, frequency } = req.body || {};

        if (!amount || amount < 1 || amount > 100000) {
            context.res = {
                status: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid donation amount.' })
            };
            return;
        }

        const amountCents = Math.round(amount * 100);
        const isMonthly = frequency === 'monthly';

        const sessionParams = {
            payment_method_types: ['card'],
            mode: isMonthly ? 'subscription' : 'payment',
            success_url: 'https://e5enclave.com/donate?status=success&session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'https://e5enclave.com/donate?status=cancelled',
            metadata: {
                organization: 'E5 Enclave Incorporated',
                type: 'donation',
                frequency: frequency || 'one-time'
            },
            submit_type: isMonthly ? undefined : 'donate',
            custom_text: {
                submit: {
                    message: 'E5 Enclave Incorporated is a 501(c)(3) nonprofit. Your donation is tax-deductible.'
                }
            }
        };

        if (isMonthly) {
            sessionParams.line_items = [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Monthly Donation to E5 Enclave',
                        description: 'Recurring monthly contribution to E5 Enclave Incorporated (501(c)(3))'
                    },
                    unit_amount: amountCents,
                    recurring: { interval: 'month' }
                },
                quantity: 1
            }];
        } else {
            sessionParams.line_items = [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Donation to E5 Enclave',
                        description: 'One-time contribution to E5 Enclave Incorporated (501(c)(3))'
                    },
                    unit_amount: amountCents
                },
                quantity: 1
            }];
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        context.res = {
            status: 200,
            headers,
            body: JSON.stringify({ url: session.url })
        };

    } catch (err) {
        context.log.error('Stripe checkout error:', err.message);
        context.res = {
            status: 500,
            headers,
            body: JSON.stringify({
                error: 'Unable to process donation at this time. Please try again or email hermes@e5enclave.com.'
            })
        };
    }
};
