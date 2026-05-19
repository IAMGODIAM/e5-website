// STRIPE-WEBHOOK — Cloudflare Pages Function
// Webhook ID: we_1TYLuiReplmGVgmeo0O5rLD3
// Events: payment_intent.succeeded | payment_intent.payment_failed
//         customer.subscription.created | invoice.payment_succeeded

import Stripe from 'stripe';

const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = '8379263084';

async function sendTelegram(message) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
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
    await sendTelegram(
      `💚 <b>E5 Enclave — Donation Received</b>\n\n` +
      `<b>Amount:</b> ${fmt(obj.amount)}\n` +
      `<b>Program:</b> ${obj.metadata?.designation || 'General Fund'}\n` +
      `<b>Donor:</b> ${obj.receipt_email || 'anonymous'}\n` +
      `<b>Type:</b> One-time gift\n` +
      `<b>Time:</b> ${now()}\n\nEIN 99-3822441 · By Grace. 🙏`
    );
  }

  if (type === 'customer.subscription.created') {
    const amount = obj.items?.data?.[0]?.price?.unit_amount ? fmt(obj.items.data[0].price.unit_amount) : '?';
    await sendTelegram(
      `🔄 <b>E5 Enclave — New Monthly Donor</b>\n\n` +
      `<b>Monthly gift:</b> ${amount}/month\n` +
      `<b>Program:</b> ${obj.metadata?.designation || 'General Fund'}\n` +
      `<b>Started:</b> ${now()}\n\nRecurring support. The record stays alive. 🔥`
    );
  }

  if (type === 'invoice.payment_succeeded' && obj.billing_reason === 'subscription_cycle') {
    await sendTelegram(
      `💙 <b>E5 Enclave — Monthly Gift Processed</b>\n\n` +
      `<b>Amount:</b> ${fmt(obj.amount_paid)}\n` +
      `<b>Donor:</b> ${obj.customer_email || 'recurring donor'}\n` +
      `<b>Time:</b> ${now()}`
    );
  }

  if (type === 'payment_intent.payment_failed') {
    await sendTelegram(
      `⚠️ <b>E5 Enclave — Donation Attempt Failed</b>\n\n` +
      `<b>Amount:</b> ${fmt(obj.amount)}\n` +
      `<b>Donor:</b> ${obj.receipt_email || 'unknown'}\n` +
      `<b>Reason:</b> ${obj.last_payment_error?.message || 'unknown reason'}\n` +
      `<b>Time:</b> ${now()}`
    );
  }

  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
