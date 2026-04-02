// ============================================================================
// PRINTFUL API CLIENT — Shared helper for all Azure Functions
// ============================================================================
// Centralizes Printful API calls so each function doesn't duplicate HTTP logic.
// Uses the PRINTFUL_API_KEY environment variable for Bearer token auth.
// ============================================================================

const PRINTFUL_BASE_URL = 'https://api.printful.com';

/**
 * Makes an authenticated request to the Printful API.
 *
 * @param {string} endpoint  - API path, e.g. "/orders" or "/shipping/rates"
 * @param {object} options   - fetch options (method, body, etc.)
 * @returns {Promise<object>} Parsed JSON response from Printful
 * @throws {Error} If the API key is missing or the request fails
 */
async function printfulRequest(endpoint, options = {}) {
    const apiKey = process.env.PRINTFUL_API_KEY;
    if (!apiKey) {
        throw new Error('PRINTFUL_API_KEY environment variable is not set');
    }

    const url = `${PRINTFUL_BASE_URL}${endpoint}`;
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    const data = await response.json();

    // Printful wraps responses in { code, result } — code 200 means success
    if (!response.ok || (data.code && data.code !== 200)) {
        const errorMsg = data.result || data.error?.message || JSON.stringify(data);
        throw new Error(`Printful API error (${response.status}): ${errorMsg}`);
    }

    return data;
}

/**
 * Creates a fulfillment order on Printful.
 *
 * @param {object} orderData - Object with { recipient, items, retail_costs? }
 * @returns {Promise<object>} The created order from Printful
 */
async function createOrder(orderData) {
    return printfulRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
    });
}

/**
 * Fetches shipping rates from Printful for a given address + items.
 *
 * @param {object} rateRequest - Object with { recipient, items }
 * @returns {Promise<object>} Shipping rate options from Printful
 */
async function getShippingRates(rateRequest) {
    return printfulRequest('/shipping/rates', {
        method: 'POST',
        body: JSON.stringify(rateRequest)
    });
}

module.exports = { printfulRequest, createOrder, getShippingRates };
