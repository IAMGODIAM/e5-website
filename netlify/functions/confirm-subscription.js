// CONFIRM-SUBSCRIPTION — Netlify Function
// After SetupIntent succeeds, creates recurring Stripe subscription
// Called by donate.js after monthly card setup completes

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const { setupIntentId, customerId, amountCents, designation } = JSON.parse(event.body || '{}');

    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    const paymentMethodId = setupIntent.payment_method;

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Create price inline
    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: parseInt(amountCents),
      recurring: { interval: 'month' },
      product_data: {
        name: `Monthly Donation — E5 Enclave (${designation || 'General Fund'})`,
      },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      metadata: {
        type: 'monthly_donation',
        designation: designation || 'General Fund',
        ein: '99-3822441',
      },
      payment_settings: { payment_method_types: ['card'], save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ subscriptionId: subscription.id, status: subscription.status }),
    };
  } catch (err) {
    console.error('Subscription error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Subscription creation failed.' }) };
  }
};
