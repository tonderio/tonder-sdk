import { coreHeaders, coreRoute } from "./coreApi";
import {
  toLegacyBanks,
  toLegacyBanksByType,
  toLegacyErrorBody,
  toLegacyPaymentMethods,
} from "../helpers/coreSupport";
import { buildErrorResponse, buildErrorResponseFromCatch } from "../helpers/utils";

/**
 * Fetches Alternative Payment Methods (APMs) of a customer.
 * @param {string} coreUrl - Host of the core.
 * @param {string} apiKey - The API key for authentication.
 * @param params - The query params to filter APMs
 * @param {AbortSignal} signal - The abort signal to cancel the request.
 * @returns {Promise<import("../../types").IPaymentMethodResponse>} The available APMs.
 */
export async function fetchCustomerAPMs(
  coreUrl,
  apiKey,
  params = {
    status: "active",
    pagesize: "10000",
  },
  signal = null,
) {
  try {
    const queryString = new URLSearchParams(params).toString();

    const response = await fetch(coreRoute(coreUrl, `/payment_methods?${queryString}`), {
      method: "GET",
      headers: { "Content-Type": "application/json", ...coreHeaders(apiKey) },
      signal,
    });

    const res_json = await response.json();
    if (response.ok) return toLegacyPaymentMethods(res_json);
    throw await buildErrorResponse(response, toLegacyErrorBody(res_json));
  } catch (error) {
    throw buildErrorResponseFromCatch(error);
  }
}

/**
 * Fetches SafetyPay banks available for a business.
 * @param {string} coreUrl - Host of the core.
 * @param {string} apiKey - The API key for authentication.
 * @param {AbortSignal} signal - The abort signal to cancel the request.
 * @returns {Promise<Object>} The available SafetyPay banks grouped by payment type.
 */
export async function fetchSafetyPayBanks(coreUrl, apiKey, signal = null) {
  try {
    const response = await fetch(coreRoute(coreUrl, "/safetypay/banks"), {
      method: "GET",
      headers: { "Content-Type": "application/json", ...coreHeaders(apiKey) },
      signal,
    });

    const res_json = await response.json();
    if (response.ok) return toLegacyBanksByType(res_json);
    throw await buildErrorResponse(response, toLegacyErrorBody(res_json));
  } catch (error) {
    throw buildErrorResponseFromCatch(error);
  }
}

/**
 * Fetches SafetyPay banks for a specific payment type.
 * @param {string} coreUrl - Host of the core.
 * @param {string} apiKey - The API key for authentication.
 * @param {string} paymentType - The payment type ('cash' or 'transfer').
 * @param {AbortSignal} signal - The abort signal to cancel the request.
 * @returns {Promise<Array>} The available SafetyPay banks for the payment type.
 */
export async function fetchSafetyPayBanksByType(coreUrl, apiKey, paymentType, signal = null) {
  try {
    const response = await fetch(coreRoute(coreUrl, `/safetypay/banks/${paymentType}`), {
      method: "GET",
      headers: { "Content-Type": "application/json", ...coreHeaders(apiKey) },
      signal,
    });

    const res_json = await response.json();
    if (response.ok) return toLegacyBanks(res_json);
    throw await buildErrorResponse(response, toLegacyErrorBody(res_json));
  } catch (error) {
    throw buildErrorResponseFromCatch(error);
  }
}
