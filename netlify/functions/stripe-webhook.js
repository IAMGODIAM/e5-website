// STRIPE-WEBHOOK — Netlify Function
// Handles post-payment events: payment_intent.succeeded, customer.subscription.created
// Fires Telegram alert + logs to E5 board EventLog via Base44

exports.handler = async (event) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let stripeEvent;
  try {
    stripeEvent = endpointSecret
      ? stripe.webhooks.constructEvent(event.body, event.headers['stripe-signature'], endpointSecret)
      : JSON.parse(event.body);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  const type = stripeEvent.type;
  const obj  = stripeEvent.data.object;

  if (type === 'payment_intent.succeeded') {
    const amount     = (obj.amount / 100).toFixed(2);
    const designation = obj.metadata?.designation || 'General Fund';
    const email      = obj.receipt_email || 'anonymous';
    console.log(`✅ Donation received: $${amount} | ${designation} | ${email}`);
    // TODO: fire Telegram alert via bot when TELEGRAM_BOT_TOKEN env set
    // TODO: POST to Base44 EventLog via API
  }

  if (type === 'customer.subscription.created') {
    const amount = (obj.items.data[0]?.price?.unit_amount / 100 || 0).toFixed(2);
    console.log(`🔄 Monthly subscription started: $${amount}/mo`);
  }

  if (type === 'invoice.payment_succeeded' && obj.billing_reason === 'subscription_cycle') {
    const amount = (obj.amount_paid / 100).toFixed(2);
    const email  = obj.customer_email || 'recurring donor';
    console.log(`🔄 Recurring donation processed: $${amount} from ${email}`);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
