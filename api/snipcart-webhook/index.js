// ============================================================================
// SNIPCART WEBHOOK HANDLER — /api/snipcart-webhook
// ============================================================================
// This Azure Function receives Snipcart's order.completed webhook and:
//   1. Parses the incoming POST body (eventName + content)
//   2. Validates the webhook by fetching the order from Snipcart's API
//   3. Transforms the Snipcart order into Printful's format
//   4. Creates a fulfillment order on Printful
//   5. Returns a 200 to Snipcart so it knows we received the webhook
//
// Snipcart will retry webhooks that don't return 2xx, so we return 200
// even on partial failures after validation, and log errors for debugging.
//
// Environment variables required:
//   SNIPCART_SECRET_API_KEY — Your Snipcart secret API key
//   PRINTFUL_API_KEY        — Your Printful API access token
// ============================================================================

const { validateSnipcartWebhook } = require('../shared/snipcart-validator');
const { transformOrder }          = require('../shared/order-transformer');
const { createOrder }             = require('../shared/printful-client');

module.exports = async function (context, req) {
    context.log('=== Snipcart Webhook Received ===');

    // ---- Step 1: Parse and validate the request body ----
    const body = req.body;

    if (!body || !body.eventName) {
        context.log.warn('Missing or invalid webhook body');
        context.res = {
            status: 400,
            body: { error: 'Invalid webhook payload — missing eventName' }
        };
        return;
    }

    context.log(`Event: ${body.eventName}`);

    // ---- Step 2: Only process order.completed events ----
    // Snipcart sends many event types (order.completed, order.refund, etc.)
    // We only care about new completed orders for Printful fulfillment.
    if (body.eventName !== 'order.completed') {
        context.log(`Ignoring event type: ${body.eventName}`);
        context.res = {
            status: 200,
            body: { message: `Event ${body.eventName} acknowledged but not processed` }
        };
        return;
    }

    const orderContent = body.content;
    if (!orderContent || !orderContent.token) {
        context.log.warn('order.completed event missing content or token');
        context.res = {
            status: 400,
            body: { error: 'Missing order content or token' }
        };
        return;
    }

    context.log(`Order token: ${orderContent.token}`);
    context.log(`Invoice: ${orderContent.invoiceNumber || 'N/A'}`);

    // ---- Step 3: Validate the webhook by fetching the order from Snipcart ----
    // This is the recommended way to verify webhooks are legitimate.
    // We fetch the order directly from Snipcart's API using our secret key.
    // If it doesn't exist, the webhook is spoofed.
    let verifiedOrder;
    try {
        verifiedOrder = await validateSnipcartWebhook(orderContent.token);
    } catch (err) {
        context.log.error('Snipcart validation threw an error:', err.message);
        context.res = {
            status: 500,
            body: { error: 'Webhook validation failed — configuration error' }
        };
        return;
    }

    if (!verifiedOrder) {
        context.log.warn('Webhook validation FAILED — order not found in Snipcart API');
        context.res = {
            status: 403,
            body: { error: 'Webhook validation failed — order not verified' }
        };
        return;
    }

    context.log('Webhook validated successfully via Snipcart API');

    // ---- Step 4: Transform the order for Printful ----
    let printfulOrderData;
    try {
        printfulOrderData = transformOrder(verifiedOrder);
        context.log(`Transformed order: ${printfulOrderData.external_id}`);
        context.log(`  Recipient: ${printfulOrderData.recipient.name}, ${printfulOrderData.recipient.city}, ${printfulOrderData.recipient.country_code}`);
        context.log(`  Items: ${printfulOrderData.items.length}`);
    } catch (err) {
        context.log.error('Order transformation failed:', err.message);
        // Return 200 to Snipcart so it doesn't retry, but log the error
        context.res = {
            status: 200,
            body: { 
                message: 'Webhook received but order transformation failed',
                error: err.message 
            }
        };
        return;
    }

    // ---- Step 5: Create the fulfillment order on Printful ----
    try {
        const printfulResponse = await createOrder(printfulOrderData);
        const createdOrder = printfulResponse.result;

        context.log(`Printful order created successfully!`);
        context.log(`  Printful order ID: ${createdOrder?.id || 'unknown'}`);
        context.log(`  Status: ${createdOrder?.status || 'unknown'}`);

        context.res = {
            status: 200,
            body: {
                message: 'Order forwarded to Printful successfully',
                printfulOrderId: createdOrder?.id,
                externalId: printfulOrderData.external_id
            }
        };
    } catch (err) {
        context.log.error('Printful order creation failed:', err.message);
        
        // Still return 200 to Snipcart — we don't want infinite retries.
        // The error is logged and should trigger an alert for manual review.
        context.res = {
            status: 200,
            body: {
                message: 'Webhook received but Printful order creation failed',
                error: err.message,
                externalId: printfulOrderData.external_id
            }
        };
    }
};
