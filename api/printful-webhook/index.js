// ============================================================================
// PRINTFUL WEBHOOK HANDLER — /api/printful-webhook
// ============================================================================
// Receives Printful's fulfillment status webhooks and logs them.
// Printful sends webhooks when orders change status:
//   - package_shipped  — Printful has shipped the package (includes tracking)
//   - package_returned — Package was returned to Printful
//   - order_created    — Order was received by Printful
//   - order_updated    — Order details were updated
//   - order_failed     — Order failed (e.g., payment issue on Printful side)
//   - order_canceled   — Order was canceled
//   - order_put_hold   — Order was put on hold
//   - order_removed_hold — Order hold was removed
//
// Printful webhook payload:
//   { type: "package_shipped", created: 1234567890,
//     data: { order: { id, external_id, status, ... },
//             shipment: { carrier, tracking_number, tracking_url, ... } } }
//
// Future enhancement: Send email notifications to customers with tracking info.
//
// Environment variables required:
//   PRINTFUL_API_KEY — Used to validate the webhook (optional verification)
// ============================================================================

module.exports = async function (context, req) {
    context.log('=== Printful Webhook Received ===');

    // ---- Step 1: Parse the webhook payload ----
    const body = req.body;

    if (!body || !body.type) {
        context.log.warn('Invalid Printful webhook — missing type');
        context.res = {
            status: 400,
            body: { error: 'Invalid webhook payload' }
        };
        return;
    }

    const eventType = body.type;
    const eventData = body.data || {};
    const retries = body.retries || 0;

    context.log(`Event type: ${eventType}`);
    context.log(`Retries: ${retries}`);
    context.log(`Created: ${body.created ? new Date(body.created * 1000).toISOString() : 'unknown'}`);

    // ---- Step 2: Extract order info ----
    const order = eventData.order || {};
    const shipment = eventData.shipment || {};

    context.log(`Printful Order ID: ${order.id || 'N/A'}`);
    context.log(`External ID (Snipcart Invoice): ${order.external_id || 'N/A'}`);
    context.log(`Order Status: ${order.status || 'N/A'}`);

    // ---- Step 3: Handle specific event types ----
    switch (eventType) {

        // ---- PACKAGE SHIPPED — The big one ----
        case 'package_shipped': {
            const carrier = shipment.carrier || 'Unknown carrier';
            const trackingNumber = shipment.tracking_number || 'N/A';
            const trackingUrl = shipment.tracking_url || 'N/A';
            const service = shipment.service || 'Standard';

            context.log('--- PACKAGE SHIPPED ---');
            context.log(`  Carrier: ${carrier}`);
            context.log(`  Service: ${service}`);
            context.log(`  Tracking Number: ${trackingNumber}`);
            context.log(`  Tracking URL: ${trackingUrl}`);
            context.log(`  Ship Date: ${shipment.ship_date || 'N/A'}`);

            // Log individual items in the shipment
            if (shipment.items && shipment.items.length > 0) {
                context.log(`  Items shipped: ${shipment.items.length}`);
                shipment.items.forEach((item, i) => {
                    context.log(`    [${i + 1}] ${item.name || 'Unknown'} x${item.quantity || 1}`);
                });
            }

            // ---- FUTURE: Send tracking email to customer ----
            // TODO: Integrate with SendGrid, Mailgun, or Azure Communication Services
            // Example:
            //   await sendTrackingEmail({
            //       to: order.recipient?.email,
            //       orderId: order.external_id,
            //       carrier, trackingNumber, trackingUrl
            //   });
            context.log('  [TODO] Send tracking email notification to customer');

            break;
        }

        // ---- PACKAGE RETURNED ----
        case 'package_returned': {
            context.log('--- PACKAGE RETURNED ---');
            context.log(`  Reason: ${eventData.reason || 'Not specified'}`);
            // TODO: Alert store owner, possibly issue refund
            context.log('  [TODO] Alert store owner about returned package');
            break;
        }

        // ---- ORDER FAILED ----
        case 'order_failed': {
            context.log('--- ORDER FAILED ---');
            context.log(`  Reason: ${eventData.reason || order.error_message || 'Unknown'}`);
            // TODO: Alert store owner immediately — this needs attention
            context.log('  [ALERT] Order failed — manual intervention may be needed');
            break;
        }

        // ---- ORDER CANCELED ----
        case 'order_canceled': {
            context.log('--- ORDER CANCELED ---');
            // TODO: Consider automatically refunding via Snipcart API
            context.log('  [TODO] Consider issuing refund via Snipcart');
            break;
        }

        // ---- ORDER CREATED / UPDATED / HOLD ----
        case 'order_created':
        case 'order_updated':
        case 'order_put_hold':
        case 'order_removed_hold': {
            context.log(`--- ${eventType.toUpperCase().replace(/_/g, ' ')} ---`);
            context.log(`  Status: ${order.status || 'unknown'}`);
            break;
        }

        // ---- UNKNOWN EVENT ----
        default: {
            context.log(`--- UNHANDLED EVENT: ${eventType} ---`);
            context.log(`  Full payload logged for debugging`);
            context.log(JSON.stringify(body, null, 2));
            break;
        }
    }

    // ---- Step 4: Always return 200 to acknowledge receipt ----
    // Printful retries webhooks that don't return 2xx
    context.res = {
        status: 200,
        body: {
            message: `Webhook ${eventType} received and logged`,
            orderId: order.id || null,
            externalId: order.external_id || null
        }
    };
};
