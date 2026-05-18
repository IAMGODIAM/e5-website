// STRIPE-WEBHOOK — Netlify Function
// Events handled:
//   payment_intent.succeeded       → one-time donation confirmed
//   customer.subscription.created  → new monthly donor
//   invoice.payment_succeeded       → recurring monthly charge
//   payment_intent.payment_failed  → failed attempt alert
// Sends Telegram alert to Chairman + logs details
// Env vars needed: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, TELEGRAM_BOT_TOKEN

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8286685508:AAEe2VjCH5sNdF5iSYrJvqb4u1RGuDNSYT0';
const TELEGRAM_CHAT_ID   = '8379263084';

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
  return '$' + (cents / 100).toFixed(2);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let stripeEvent;

  try {
    stripeEvent = endpointSecret
      ? stripe.webhooks.constructEvent(
          event.body,
          event.headers['stripe-signature'],
          endpointSecret
        )
      : JSON.parse(event.body);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  const type = stripeEvent.type;
  const obj  = stripeEvent.data.object;

  // ── ONE-TIME DONATION SUCCEEDED ────────────────────────────────────
  if (type === 'payment_intent.succeeded') {
    const amount      = fmt(obj.amount);
    const designation = obj.metadata?.designation || 'General Fund';
    const email       = obj.receipt_email || 'anonymous';
    const last4       = obj.payment_method ? '(card on file)' : '';

    const msg = `💚 <b>Donation received — E5 Enclave</b>\n\n` +
      `<b>Amount:</b> ${amount}\n` +
      `<b>Designation:</b> ${designation}\n` +
      `<b>Donor:</b> ${email}\n` +
      `<b>Type:</b> One-time\n` +
      `<b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET\n\n` +
      `<i>EIN 99-3822441 · By Grace.</i>`;

    await sendTelegram(msg);
    console.log(`✅ One-time donation: ${amount} | ${designation} | ${email}`);
  }

  // ── NEW MONTHLY SUBSCRIPTION ────────────────────────────────────────
  if (type === 'customer.subscription.created') {
    const item        = obj.items?.data?.[0];
    const amount      = item ? fmt(obj.items.data[0].price.unit_amount) : '?';
    const designation = obj.metadata?.designation || 'General Fund';
    const custId      = obj.customer;

    const msg = `🔄 <b>New monthly donor — E5 Enclave</b>\n\n` +
      `<b>Monthly amount:</b> ${amount}/mo\n` +
      `<b>Designation:</b> ${designation}\n` +
      `<b>Stripe customer:</b> ${custId}\n` +
      `<b>Started:</b> ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET\n\n` +
      `<i>Recurring support. The record stays alive. By Grace.</i>`;

    await sendTelegram(msg);
    console.log(`🔄 New subscription: ${amount}/mo | ${designation}`);
  }

  // ── RECURRING MONTHLY CHARGE PROCESSED ─────────────────────────────
  if (type === 'invoice.payment_succeeded' && obj.billing_reason === 'subscription_cycle') {
    const amount = fmt(obj.amount_paid);
    const email  = obj.customer_email || 'recurring donor';

    const msg = `🔄 <b>Monthly donation processed — E5 Enclave</b>\n\n` +
      `<b>Amount:</b> ${amount}\n` +
      `<b>Donor:</b> ${email}\n` +
      `<b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`;

    await sendTelegram(msg);
    console.log(`🔄 Recurring charge: ${amount} from ${email}`);
  }

  // ── PAYMENT FAILED ALERT ────────────────────────────────────────────
  if (type === 'payment_intent.payment_failed') {
    const amount      = fmt(obj.amount);
    const email       = obj.receipt_email || 'unknown';
    const reason      = obj.last_payment_error?.message || 'unknown reason';

    const msg = `⚠️ <b>Donation attempt failed — E5 Enclave</b>\n\n` +
      `<b>Amount attempted:</b> ${amount}\n` +
      `<b>Donor:</b> ${email}\n` +
      `<b>Reason:</b> ${reason}\n` +
      `<b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET`;

    await sendTelegram(msg);
    console.log(`⚠️ Failed payment: ${amount} | ${email} | ${reason}`);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
