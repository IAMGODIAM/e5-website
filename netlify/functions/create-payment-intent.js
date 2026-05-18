// CREATE-PAYMENT-INTENT — Netlify Function
// Powers the on-page Stripe Payment Element (zero redirect)
// Supports: one-time donations + monthly subscriptions
// Env var needed: STRIPE_SECRET_KEY

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { amount, frequency, designation, email } = JSON.parse(event.body || '{}');

    if (!amount || amount < 1 || amount > 100000) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid donation amount.' }) };
    }

    const amountCents = Math.round(parseFloat(amount) * 100);
    const isMonthly = frequency === 'monthly';
    const desc = `${isMonthly ? 'Monthly donation' : 'Donation'} — E5 Enclave Incorporated (EIN 99-3822441) — ${designation || 'General Fund'}`;

    // Create or find customer for monthly
    let customerId;
    if (isMonthly && email) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const customer = await stripe.customers.create({ email, description: 'E5 Enclave donor' });
        customerId = customer.id;
      }
    }

    if (isMonthly) {
      // Monthly: create SetupIntent so we can create subscription after card is saved
      const setupIntent = await stripe.setupIntents.create({
        usage: 'off_session',
        ...(customerId ? { customer: customerId } : {}),
        metadata: {
          type: 'monthly_donation',
          amount_cents: amountCents,
          designation: designation || 'General Fund',
          ein: '99-3822441',
        },
      });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          clientSecret: setupIntent.client_secret,
          intentType: 'setup',
          customerId,
        }),
      };
    } else {
      // One-time: PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        description: desc,
        receipt_email: email || undefined,
        metadata: {
          type: 'one_time_donation',
          designation: designation || 'General Fund',
          organization: 'E5 Enclave Incorporated',
          ein: '99-3822441',
          frequency: 'one-time',
        },
        statement_descriptor_suffix: 'E5ENCLAVE',
      });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          intentType: 'payment',
        }),
      };
    }
  } catch (err) {
    console.error('PaymentIntent error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Payment initialization failed. Please try again.' }) };
  }
};
