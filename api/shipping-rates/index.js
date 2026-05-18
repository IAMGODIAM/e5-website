// ============================================================================
// SHIPPING RATES PROXY — /api/shipping-rates
// ============================================================================
// Snipcart can use a custom shipping rates webhook to fetch live rates.
// When a customer enters their shipping address at checkout, Snipcart POSTs
// to this endpoint with the address + cart items. We proxy that to Printful's
// /shipping/rates endpoint and return the results in Snipcart's expected format.
//
// Snipcart sends (simplified):
//   { content: {
//       shippingAddress: { name, address1, city, province, country, postalCode },
//       items: [{ id, name, price, quantity, weight, customFields }]
//   }}
//
// Snipcart expects back:
//   { rates: [{ cost, description, guaranteedDaysToDelivery? }] }
//
// Printful returns (simplified):
//   { result: [{ id, name, rate, currency, minDeliveryDays, maxDeliveryDays }] }
//
// Environment variables required:
//   PRINTFUL_API_KEY — Your Printful API access token
// ============================================================================

const { getShippingRates } = require('../shared/printful-client');
const { getCustomField }   = require('../shared/order-transformer');

module.exports = async function (context, req) {
    context.log('=== Shipping Rates Request Received ===');

    // ---- Step 1: Parse the Snipcart request ----
    const body = req.body;
    const content = body?.content;

    if (!content) {
        context.log.warn('Missing content in shipping rates request');
        context.res = {
            status: 200,
            body: { rates: [] }   // Return empty rates — Snipcart handles gracefully
        };
        return;
    }

    const shippingAddress = content.shippingAddress || {};
    const cartItems = content.items || [];

    context.log(`Shipping to: ${shippingAddress.city || '?'}, ${shippingAddress.province || '?'}, ${shippingAddress.country || '?'}`);
    context.log(`Cart items: ${cartItems.length}`);

    // ---- Step 2: Build the Printful shipping rates request ----
    // Map the Snipcart address + items into Printful's format
    const printfulRecipient = {
        address1:     shippingAddress.address1 || '',
        address2:     shippingAddress.address2 || '',
        city:         shippingAddress.city || '',
        state_code:   shippingAddress.province || '',
        country_code: shippingAddress.country || '',
        zip:          shippingAddress.postalCode || ''
    };

    // Map each cart item to a Printful item for rate calculation
    const printfulItems = cartItems.map(item => {
        const printfulSyncVariantId = getCustomField(item, 'printful_sync_variant_id');
        const printfulVariantId = getCustomField(item, 'printful_variant_id');

        const rateItem = {
            quantity: item.quantity || 1
        };

        if (printfulSyncVariantId) {
            rateItem.sync_variant_id = parseInt(printfulSyncVariantId, 10);
        } else if (printfulVariantId) {
            rateItem.variant_id = parseInt(printfulVariantId, 10);
        } else {
            // Without a variant ID, Printful can't calculate rates.
            // We use external_id as a last resort but it may not work.
            context.log.warn(`Item "${item.name}" missing Printful variant ID for rate calc`);
            rateItem.external_id = item.id;
        }

        return rateItem;
    });

    // ---- Step 3: Call Printful's shipping rates API ----
    let printfulRates;
    try {
        const response = await getShippingRates({
            recipient: printfulRecipient,
            items: printfulItems
        });

        printfulRates = response.result || [];
        context.log(`Printful returned ${printfulRates.length} shipping options`);
    } catch (err) {
        context.log.error('Printful shipping rates failed:', err.message);

        // Return a fallback flat rate so the customer can still check out.
        // You may want to adjust this based on your business needs.
        context.res = {
            status: 200,
            body: {
                rates: [
                    {
                        cost: 9.99,
                        description: 'Standard Shipping (estimated)',
                        guaranteedDaysToDelivery: null
                    }
                ]
            }
        };
        return;
    }

    // ---- Step 4: Transform Printful rates into Snipcart format ----
    // Printful: { id, name, rate, currency, minDeliveryDays, maxDeliveryDays }
    // Snipcart: { cost, description, guaranteedDaysToDelivery }
    const snipcartRates = printfulRates.map(rate => {
        // Build a user-friendly description
        let description = rate.name || 'Shipping';
        if (rate.minDeliveryDays && rate.maxDeliveryDays) {
            description += ` (${rate.minDeliveryDays}-${rate.maxDeliveryDays} business days)`;
        } else if (rate.maxDeliveryDays) {
            description += ` (up to ${rate.maxDeliveryDays} business days)`;
        }

        return {
            cost: parseFloat(rate.rate) || 0,
            description: description,
            // Snipcart uses guaranteedDaysToDelivery for delivery estimates
            guaranteedDaysToDelivery: rate.maxDeliveryDays || null
        };
    });

    // Sort by cost so cheapest option appears first
    snipcartRates.sort((a, b) => a.cost - b.cost);

    context.log(`Returning ${snipcartRates.length} rates to Snipcart`);

    context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { rates: snipcartRates }
    };
};
