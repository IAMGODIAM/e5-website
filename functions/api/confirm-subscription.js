// CONFIRM-SUBSCRIPTION — Cloudflare Pages Function
// Called after SetupIntent is confirmed on client
// Creates the actual Stripe subscription for monthly donors

import Stripe from 'stripe';

const TELEGRAM_CHAT_ID = '8379263084';

async function sendTelegram(token, message) {
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML' }),
    });
  } catch (err) {
    console.error('Telegram alert failed:', err.message);
  }
}

function fmt(cents) {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function now() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  }) + ' ET';
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 200, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
  const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), { status: 400, headers: CORS_HEADERS });
  }

  const { setupIntentId, customerId, amountCents, designation } = body;

  if (!setupIntentId || !customerId || !amountCents || amountCents < 100) {
    return new Response(JSON.stringify({ error: 'Missing required fields.' }), { status: 400, headers: CORS_HEADERS });
  }

  try {
    // Retrieve the SetupIntent to get the payment method
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    if (setupIntent.status !== 'succeeded') {
      return new Response(JSON.stringify({ error: 'SetupIntent not yet succeeded.' }), { status: 400, headers: CORS_HEADERS });
    }

    const paymentMethod = setupIntent.payment_method;
    if (!paymentMethod) {
      return new Response(JSON.stringify({ error: 'No payment method attached to SetupIntent.' }), { status: 400, headers: CORS_HEADERS });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethod, { customer: customerId });

    // Set as default
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethod },
    });

    // Look up or create a price for this exact amount
    // E5 Enclave uses a single recurring product with amount-based prices
    const productList = await stripe.products.list({ active: true, limit: 50 });
    let monthlyProduct = productList.data.find(p => p.metadata?.type === 'monthly_donation');

    if (!monthlyProduct) {
      monthlyProduct = await stripe.products.create({
        name: 'E5 Enclave Monthly Donation',
        metadata: { type: 'monthly_donation', ein: '99-3822441' },
      });
    }

    // Find or create a price for this amount
    const priceList = await stripe.prices.list({
      product: monthlyProduct.id,
      active: true,
      limit: 100,
    });

    let price = priceList.data.find(p =>
      p.unit_amount === amountCents &&
      p.currency === 'usd' &&
      p.recurring?.interval === 'month'
    );

    if (!price) {
      price = await stripe.prices.create({
        product: monthlyProduct.id,
        unit_amount: amountCents,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { designation: designation || 'General Fund' },
      });
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      default_payment_method: paymentMethod,
      metadata: {
        type: 'monthly_donation',
        designation: designation || 'General Fund',
        organization: 'E5 Enclave Incorporated',
        ein: '99-3822441',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    // Telegram alert
    await sendTelegram(TELEGRAM_BOT_TOKEN,
      `🔄 <b>E5 Enclave — New Monthly Donor</b>\n\n` +
      `<b>Amount:</b> ${fmt(amountCents)}/mo\n` +
      `<b>Program:</b> ${designation || 'General Fund'}\n` +
      `<b>Sub ID:</b> ${subscription.id}\n` +
      `<b>Status:</b> ${subscription.status}\n` +
      `<b>Time:</b> ${now()}`
    );

    return new Response(JSON.stringify({
      subscriptionId: subscription.id,
      status: subscription.status,
    }), { status: 200, headers: CORS_HEADERS });

  } catch (err) {
    console.error('confirm-subscription error:', err.message);
    return new Response(JSON.stringify({ error: 'Subscription creation failed. Please contact accounts@e5enclave.com' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}
