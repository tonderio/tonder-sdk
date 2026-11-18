import { fetchWithSignatureHeaders } from "../shared/utils/apiFetch";
import { CORE_APP_ORIGIN } from "../shared/constants/paymentEngine";

const coreHeaders = apiKey => ({
  Authorization: `Token ${apiKey}`,
  "X-App-Origin": CORE_APP_ORIGIN,
});

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

async function throwCoreError(response, message) {
  const error = new Error(message);
  error.status = response.status;
  error.body = await parseJson(response);
  throw error;
}

/**
 * Fetches the business configuration (and `core_payments_enabled`) from the core.
 * @param {string} coreUrl - Host of the core.
 * @param {string} apiKey - The merchant API key.
 * @param {AbortSignal} signal - The abort signal to cancel the request.
 * @returns {Promise<Object>} The business configuration.
 */
export async function fetchCoreBusinessConfig(coreUrl, apiKey, signal) {
  const response = await fetch(`${coreUrl}/transactions/v1/business/config`, {
    headers: coreHeaders(apiKey),
    signal,
  });
  if (!response.ok) await throwCoreError(response, "Failed to fetch the business configuration");
  return await response.json();
}

/**
 * Creates a card payment in the core. One request id per payment attempt.
 * On a non-2xx answer it throws an error carrying `status` and the answer `body`.
 * @returns {Promise<Object>} The core's answer.
 */
export async function processCorePayment(signatures, coreUrl, apiKey, body, requestId) {
  const response = await fetchWithSignatureHeaders(
    `${coreUrl}/transactions/v1/process`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
        ...coreHeaders(apiKey),
      },
      body: JSON.stringify(body),
    },
    signatures,
  );
  if (!response.ok) await throwCoreError(response, "Failed to process the payment");
  return await response.json();
}

const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

/**
 * Resolves a stored verify URL against the configured core host. The URL comes from
 * `localStorage`, which the API key must never be sent from to another origin: anything outside
 * the core's origin, or cleartext HTTP outside localhost, is refused.
 * @returns {string|null} The URL to call, or null when it is not trusted.
 */
export function resolveCoreUrl(coreUrl, verifyUrl) {
  try {
    const base = new URL(coreUrl);
    const url = new URL(verifyUrl, base);
    if (url.origin !== base.origin) return null;
    if (url.protocol === "http:" && !LOCAL_HOSTS.includes(url.hostname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Reads a payment from the core by its status-check URL.
 * @returns {Promise<{ status: number, body: Object }>}
 */
export async function fetchCoreTransaction(url, apiKey) {
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...coreHeaders(apiKey) },
  });
  return { status: response.status, body: await parseJson(response) };
}
