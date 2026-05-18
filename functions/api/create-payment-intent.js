// CREATE-PAYMENT-INTENT — Cloudflare Pages Function
// Powers the on-page Stripe Payment Element (zero redirect)
// Supports: one-time donations + monthly subscriptions

import Stripe from 'stripe';

export async function onRequestPost(context) {
  const { request, env } = context;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    const { amount, frequency, designation, email } = await request.json();

    if (!amount || amount < 1 || amount > 100000) {
      return new Response(JSON.stringify({ error: 'Invalid donation amount.' }), { status: 400, headers });
    }

    const amountCents = Math.round(parseFloat(amount) * 100);
    const isMonthly = frequency === 'monthly';
    const desc = `${isMonthly ? 'Monthly donation' : 'Donation'} — E5 Enclave Incorporated (EIN 99-3822441) — ${designation || 'General Fund'}`;

    let customerId;
    if (isMonthly && email) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      customerId = existing.data.length > 0
        ? existing.data[0].id
        : (await stripe.customers.create({ email, description: 'E5 Enclave donor' })).id;
    }

    if (isMonthly) {
      const setupIntent = await stripe.setupIntents.create({
        usage: 'off_session',
        ...(customerId ? { customer: customerId } : {}),
        metadata: { type: 'monthly_donation', amount_cents: amountCents, designation: designation || 'General Fund', ein: '99-3822441' },
      });
      return new Response(JSON.stringify({ clientSecret: setupIntent.client_secret, intentType: 'setup', customerId }), { status: 200, headers });
    } else {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        description: desc,
        receipt_email: email || undefined,
        metadata: { type: 'one_time_donation', designation: designation || 'General Fund', organization: 'E5 Enclave Incorporated', ein: '99-3822441', frequency: 'one-time' },
        statement_descriptor_suffix: 'E5ENCLAVE',
      });
      return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret, intentType: 'payment' }), { status: 200, headers });
    }
  } catch (err) {
    console.error('PaymentIntent error:', err.message);
    return new Response(JSON.stringify({ error: 'Payment initialization failed. Please try again.' }), { status: 500, headers });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
