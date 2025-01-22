/**
 * Fetches business information.
 * @param {string} baseUrl - The base URL of the Tonder API.
 * @param {string} apiKey - The API key for authentication.
 * @param {AbortSignal} signal - The abort signal to cancel the request.
 * @returns {Promise<Object>} The business information.
 */
export async function fetchBusiness(baseUrl, apiKey, signal) {
  const getBusiness = await fetch(`${baseUrl}/api/v1/payments/business/${apiKey}`, {
    headers: {
      Authorization: `Token ${apiKey}`,
    },
    signal: signal,
  });
  return await getBusiness.json();
}
