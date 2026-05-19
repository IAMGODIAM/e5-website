// STRIPE-WEBHOOK — Cloudflare Pages Function
// Webhook ID: we_1TYLuiReplmGVgmeo0O5rLD3
// Events: payment_intent.succeeded | payment_intent.payment_failed
//         customer.subscription.created | invoice.payment_succeeded

import Stripe from 'stripe';

const TELEGRAM_CHAT_ID = '8379263084';

async function sendTelegram(token, message) {
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
  return new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' }) + ' ET';
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const WH_SECRET = env.STRIPE_WEBHOOK_SECRET;
  const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;

  if (!WH_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return new Response('Webhook not configured', { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

  let stripeEvent;
  try {
    stripeEvent = await stripe.webhooks.constructEventAsync(body, sig, WH_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const { type, data: { object: obj } } = stripeEvent;
  console.log(`Stripe event: ${type}`);

  if (type === 'payment_intent.succeeded') {
    await sendTelegram(TELEGRAM_BOT_TOKEN,
      `💚 <b>E5 Enclave — Donation Received</b>\n\n` +
      `<b>Amount:</b> ${fmt(obj.amount)}\n` +
      `<b>Program:</b> ${obj.metadata?.designation || 'General Fund'}\n` +
      `<b>Time:</b> ${now()}`
    );
  } else if (type === 'payment_intent.payment_failed') {
    await sendTelegram(TELEGRAM_BOT_TOKEN,
      `🔴 <b>E5 Enclave — Payment Failed</b>\n\n` +
      `<b>Amount:</b> ${fmt(obj.amount)}\n` +
      `<b>Reason:</b> ${obj.last_payment_error?.message || 'Unknown'}\n` +
      `<b>Time:</b> ${now()}`
    );
  } else if (type === 'customer.subscription.created') {
    await sendTelegram(TELEGRAM_BOT_TOKEN,
      `🔔 <b>E5 Enclave — New Subscription</b>\n\n` +
      `<b>Plan:</b> ${obj.items?.data[0]?.price?.nickname || obj.id}\n` +
      `<b>Status:</b> ${obj.status}\n` +
      `<b>Time:</b> ${now()}`
    );
  } else if (type === 'invoice.payment_succeeded') {
    await sendTelegram(TELEGRAM_BOT_TOKEN,
      `✅ <b>E5 Enclave — Invoice Paid</b>\n\n` +
      `<b>Amount:</b> ${fmt(obj.amount_paid)}\n` +
      `<b>Time:</b> ${now()}`
    );
  }

  return new Response('OK', { status: 200 });
}
