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

/**
 * Fetches SafetyPay banks available for a business.
 * @param {string} baseUrl - The base URL of the API.
 * @param {string} apiKey - The API key for authentication.
 * @param {AbortSignal} signal - The abort signal to cancel the request.
 * @returns {Promise<Object>} The available SafetyPay banks grouped by payment type.
 */
export async function fetchSafetyPayBanks(baseUrl, apiKey, signal = null) {
  try {
    const response = await fetch(`${baseUrl}/api/v1/safetypay/banks/${apiKey}/`, {
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

/**
 * Fetches SafetyPay banks for a specific payment type.
 * @param {string} baseUrl - The base URL of the API.
 * @param {string} apiKey - The API key for authentication.
 * @param {string} paymentType - The payment type ('cash' or 'transfer').
 * @param {AbortSignal} signal - The abort signal to cancel the request.
 * @returns {Promise<Array>} The available SafetyPay banks for the payment type.
 */
export async function fetchSafetyPayBanksByType(baseUrl, apiKey, paymentType, signal = null) {
  try {
    const response = await fetch(`${baseUrl}/api/v1/safetypay/banks/${apiKey}/${paymentType}/`, {
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
