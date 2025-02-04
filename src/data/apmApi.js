import { buildErrorResponse, buildErrorResponseFromCatch } from "../helpers/utils";

/**
 * Fetches Alternative Payment Methods (APMs) of a customer.
 * @param {string} baseUrl - The base URL of the  API.
 * @param {string} apiKey - The API key for authentication.
 * @param params - The query params to filter APMs
 * @param {AbortSignal} signal - The abort signal to cancel the request.
 * @returns {Promise<import("../../types").IPaymentMethodResponse>} The available APMs.
 */
export async function fetchCustomerAPMs(
  baseUrl,
  apiKey,
  params = {
    status: "active",
    pagesize: "10000",
  },
  signal = null,
) {
  try {
    const queryString = new URLSearchParams(params).toString();

    const response = await fetch(`${baseUrl}/api/v1/payment_methods?${queryString}`, {
      method: "GET",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal,
    });

    if (response.ok) return await response.json();
    const res_json = await response.json();
    throw await buildErrorResponse(response, res_json);
  } catch (error) {
    throw buildErrorResponseFromCatch(error);
  }
}
