// CREATE-CHECKOUT — Netlify Function
// Replaces: api/create-checkout (Azure Function)
// Env var needed: STRIPE_SECRET_KEY (set in Netlify dashboard)

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://e5enclave.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({ error: 'Payment system is being configured. Please email contact@e5enclave.com to arrange your donation.' })
      };
    }

    const { amount, frequency, designation } = JSON.parse(event.body || '{}');

    if (!amount || amount < 1 || amount > 100000) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid donation amount.' }) };
    }

    const amountCents = Math.round(amount * 100);
    const isMonthly = frequency === 'monthly';

    const sessionParams = {
      payment_method_types: ['card'],
      mode: isMonthly ? 'subscription' : 'payment',
      success_url: 'https://e5enclave.com/donate/?status=success&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://e5enclave.com/donate/?status=cancelled',
      metadata: {
        organization: 'E5 Enclave Incorporated',
        type: 'donation',
        frequency: frequency || 'one-time',
        designation: designation || 'General Fund',
        ein: '99-3822441'
      },
      submit_type: isMonthly ? undefined : 'donate',
      custom_text: {
        submit: {
          message: 'E5 Enclave Incorporated is a 501(c)(3) nonprofit (EIN 99-3822441). Your donation is tax-deductible.'
        }
      }
    };

    const lineItem = {
      price_data: {
        currency: 'usd',
        product_data: {
          name: isMonthly ? 'Monthly Donation — E5 Enclave' : 'Donation — E5 Enclave',
          description: isMonthly
            ? 'Recurring monthly contribution to E5 Enclave Incorporated (EIN 99-3822441, 501(c)(3))'
            : 'One-time contribution to E5 Enclave Incorporated (EIN 99-3822441, 501(c)(3))',
        },
        unit_amount: amountCents,
        ...(isMonthly ? { recurring: { interval: 'month' } } : {})
      },
      quantity: 1
    };

    sessionParams.line_items = [lineItem];

    const session = await stripe.checkout.sessions.create(sessionParams);

    return { statusCode: 200, headers, body: JSON.stringify({ url: session.url }) };

  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Unable to process donation. Please try again or email contact@e5enclave.com.' })
    };
  }
};
