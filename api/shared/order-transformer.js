// ============================================================================
// ORDER TRANSFORMER — Converts Snipcart order format to Printful order format
// ============================================================================
// Snipcart and Printful have different data shapes. This module bridges them.
//
// Snipcart order shape (simplified):
//   { token, invoiceNumber, email, cardHolderName,
//     billingAddress: { ... },
//     shippingAddress: { name, address1, address2, city, province, country, postalCode, phone },
//     items: [{ id, name, price, quantity, customFields: [...] }],
//     finalGrandTotal, shippingFees }
//
// Printful order shape (simplified):
//   { external_id, recipient: { name, address1, city, state_code, country_code, zip, email, phone },
//     items: [{ sync_variant_id OR variant_id, quantity, retail_price, files: [...] }],
//     retail_costs: { subtotal, shipping, total } }
//
// Product mapping: Each Snipcart item needs a custom field "printful_variant_id"
// that maps to the Printful sync variant. This is set in your product HTML.
// ============================================================================

/**
 * Transforms a validated Snipcart order into a Printful order payload.
 *
 * @param {object} snipcartOrder - The full Snipcart order object
 * @returns {object} A Printful-compatible order object
 */
function transformOrder(snipcartOrder) {
    // ---- Build the recipient (shipping address) ----
    const ship = snipcartOrder.shippingAddress || snipcartOrder.billingAddress || {};
    const recipient = {
        name:         ship.name || ship.fullName || snipcartOrder.cardHolderName || '',
        address1:     ship.address1 || '',
        address2:     ship.address2 || '',
        city:         ship.city || '',
        state_code:   ship.province || '',       // Snipcart uses "province"
        country_code: ship.country || '',         // Snipcart uses ISO 2-letter codes
        zip:          ship.postalCode || '',
        email:        snipcartOrder.email || '',
        phone:        ship.phone || ''
    };

    // ---- Map Snipcart line items to Printful items ----
    const items = (snipcartOrder.items || []).map(item => {
        // Extract the Printful variant ID from Snipcart custom fields
        // In your product HTML: data-item-custom1-name="printful_variant_id"
        //                       data-item-custom1-type="hidden"
        //                       data-item-custom1-value="12345"
        const printfulVariantId = getCustomField(item, 'printful_variant_id');
        const printfulSyncVariantId = getCustomField(item, 'printful_sync_variant_id');

        const printfulItem = {
            quantity:     item.quantity || 1,
            retail_price: String(item.price || '0.00')
        };

        // Prefer sync_variant_id (for Printful-synced products) over variant_id
        if (printfulSyncVariantId) {
            printfulItem.sync_variant_id = parseInt(printfulSyncVariantId, 10);
        } else if (printfulVariantId) {
            printfulItem.variant_id = parseInt(printfulVariantId, 10);
        } else {
            // Fallback: use the Snipcart item ID and hope it matches
            // This will likely fail — log a warning
            console.warn(`Item "${item.name}" has no printful_variant_id or printful_sync_variant_id custom field`);
            printfulItem.external_id = item.id;
        }

        // If the item has a design file URL in custom fields, attach it
        const designUrl = getCustomField(item, 'design_url');
        if (designUrl) {
            printfulItem.files = [
                { type: 'default', url: designUrl }
            ];
        }

        return printfulItem;
    });

    // ---- Build the complete Printful order ----
    const printfulOrder = {
        // Use Snipcart invoice number as Printful external ID for cross-reference
        external_id: snipcartOrder.invoiceNumber || snipcartOrder.token,
        recipient,
        items,
        // Include retail costs so Printful knows what the customer paid
        // (used for packing slips / customs declarations)
        retail_costs: {
            subtotal: String(snipcartOrder.itemsTotal || '0.00'),
            shipping: String(snipcartOrder.shippingFees || '0.00'),
            tax:      String(snipcartOrder.taxesTotal || '0.00'),
            total:    String(snipcartOrder.finalGrandTotal || '0.00')
        }
    };

    return printfulOrder;
}

/**
 * Extracts a custom field value from a Snipcart line item.
 * Snipcart stores custom fields as an array:
 *   [{ name: "printful_variant_id", value: "12345" }, ...]
 *
 * @param {object} item      - A Snipcart line item
 * @param {string} fieldName - The custom field name to look for
 * @returns {string|null} The field value, or null if not found
 */
function getCustomField(item, fieldName) {
    if (!item.customFields || !Array.isArray(item.customFields)) {
        return null;
    }
    const field = item.customFields.find(
        f => f.name === fieldName || f.name === fieldName.replace(/_/g, ' ')
    );
    return field ? field.value : null;
}

module.exports = { transformOrder, getCustomField };
