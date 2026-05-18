// STRIPE-WEBHOOK — Netlify Function — HARDENED
// Webhook ID: we_1TYLuiReplmGVgmeo0O5rLD3
// Registered endpoint: https://e5enclave.com/api/stripe-webhook
// Signing secret: loaded from STRIPE_WEBHOOK_SECRET env var (set in Netlify dashboard)
// Events: payment_intent.succeeded | payment_intent.payment_failed
//         customer.subscription.created | invoice.payment_succeeded
// Telegram: Chairman alert on every event

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8286685508:AAEe2VjCH5sNdF5iSYrJvqb4u1RGuDNSYT0';
const TELEGRAM_CHAT_ID   = '8379263084';
const WH_SECRET          = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_AjSIH1L4UjeMnjziRdxCHY1udRZfrOlO';

async function sendTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let stripeEvent;
  try {
    stripeEvent = WH_SECRET
      ? stripe.webhooks.constructEvent(event.body, event.headers['stripe-signature'], WH_SECRET)
      : JSON.parse(event.body);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  const { type, data: { object: obj } } = stripeEvent;
  console.log(`Stripe event received: ${type}`);

  // ── ONE-TIME DONATION ──────────────────────────────────────────────
  if (type === 'payment_intent.succeeded') {
    const amount      = fmt(obj.amount);
    const designation = obj.metadata?.designation || 'General Fund';
    const email       = obj.receipt_email || 'anonymous';
    await sendTelegram(
      `💚 <b>E5 Enclave — Donation Received</b>\n\n` +
      `<b>Amount:</b> ${amount}\n` +
      `<b>Program:</b> ${designation}\n` +
      `<b>Donor:</b> ${email}\n` +
      `<b>Type:</b> One-time gift\n` +
      `<b>Time:</b> ${now()}\n\n` +
      `EIN 99-3822441 · By Grace. 🙏`
    );
  }

  // ── NEW MONTHLY SUBSCRIBER ─────────────────────────────────────────
  if (type === 'customer.subscription.created') {
    const amount      = obj.items?.data?.[0]?.price?.unit_amount
      ? fmt(obj.items.data[0].price.unit_amount)
      : '?';
    const designation = obj.metadata?.designation || 'General Fund';
    await sendTelegram(
      `🔄 <b>E5 Enclave — New Monthly Donor</b>\n\n` +
      `<b>Monthly gift:</b> ${amount}/month\n` +
      `<b>Program:</b> ${designation}\n` +
      `<b>Started:</b> ${now()}\n\n` +
      `Recurring support. The record stays alive. 🔥`
    );
  }

  // ── RECURRING CHARGE ───────────────────────────────────────────────
  if (type === 'invoice.payment_succeeded' && obj.billing_reason === 'subscription_cycle') {
    const amount = fmt(obj.amount_paid);
    const email  = obj.customer_email || 'recurring donor';
    await sendTelegram(
      `💙 <b>E5 Enclave — Monthly Gift Processed</b>\n\n` +
      `<b>Amount:</b> ${amount}\n` +
      `<b>Donor:</b> ${email}\n` +
      `<b>Time:</b> ${now()}`
    );
  }

  // ── FAILED PAYMENT ─────────────────────────────────────────────────
  if (type === 'payment_intent.payment_failed') {
    const amount = fmt(obj.amount);
    const email  = obj.receipt_email || 'unknown';
    const reason = obj.last_payment_error?.message || 'unknown reason';
    await sendTelegram(
      `⚠️ <b>E5 Enclave — Donation Attempt Failed</b>\n\n` +
      `<b>Amount:</b> ${amount}\n` +
      `<b>Donor:</b> ${email}\n` +
      `<b>Reason:</b> ${reason}\n` +
      `<b>Time:</b> ${now()}`
    );
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
