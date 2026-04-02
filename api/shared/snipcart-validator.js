// ============================================================================
// SNIPCART WEBHOOK VALIDATOR — Verifies incoming Snipcart webhooks
// ============================================================================
// Snipcart's recommended validation approach:
//   1. Receive the webhook POST containing { eventName, content }
//   2. Extract the order token from content.token
//   3. Fetch that order directly from the Snipcart API using your secret key
//   4. If it exists and matches, the webhook is legitimate
//
// This prevents spoofed webhooks — only real Snipcart orders will validate.
// ============================================================================

const SNIPCART_API_URL = 'https://app.snipcart.com/api';

/**
 * Validates a Snipcart webhook by fetching the order from Snipcart's API.
 *
 * @param {string} orderToken - The order token from the webhook payload
 * @returns {Promise<object|null>} The verified order object, or null if invalid
 */
async function validateSnipcartWebhook(orderToken) {
    const secretKey = process.env.SNIPCART_SECRET_API_KEY;
    if (!secretKey) {
        throw new Error('SNIPCART_SECRET_API_KEY environment variable is not set');
    }

    if (!orderToken) {
        return null;
    }

    try {
        // Snipcart API uses Basic auth with the secret key as username, no password
        const authHeader = 'Basic ' + Buffer.from(secretKey + ':').toString('base64');

        const response = await fetch(`${SNIPCART_API_URL}/orders/${orderToken}`, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`Snipcart validation failed: HTTP ${response.status}`);
            return null;
        }

        const order = await response.json();
        return order;
    } catch (err) {
        console.error('Snipcart validation error:', err.message);
        return null;
    }
}

module.exports = { validateSnipcartWebhook };
