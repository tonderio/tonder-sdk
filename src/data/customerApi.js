import { coreHeaders, coreRoute } from "./coreApi";
import { toLegacyCustomer } from "../helpers/coreSupport";

/**
 * Registers a new customer or fetches an existing customer.
 * @param {string} baseUrl - Host of the engine that holds the customer: the core's with `core`.
 * @param {string} apiKey - The API key for authentication.
 * @param {Object} customer - The customer data.
 * @param {AbortSignal} signal - The abort signal to cancel the request.
 * @param {boolean} core - Whether the customer lives on the core (`core_payments_enabled`).
 * @returns {Promise<Object>} The registered or fetched customer data; from the core, its answer
 * mapped to the monolith's `id` and `auth_token`.
 */
export async function registerOrFetchCustomer(
  baseUrl,
  apiKey,
  customer,
  signal = null,
  core = false,
) {
  const url = core ? coreRoute(baseUrl, "/customer") : `${baseUrl}/api/v1/customer/`;
  const data = {
    email: customer.email,
    first_name: customer?.firstName,
    last_name: customer?.lastName,
    phone: customer?.phone,
  };
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(core ? coreHeaders(apiKey) : { Authorization: `Token ${apiKey}` }),
    },
    signal: signal,
    body: JSON.stringify(data),
  });

  if (response.status === 201) {
    const body = await response.json();
    return core ? toLegacyCustomer(body) : body;
  }
  if (!core) throw new Error(`Error: ${response.statusText}`);

  const body = await response.json().catch(() => undefined);
  const error = new Error(`Error: ${body?.error?.message ?? response.statusText}`);
  error.status = response.status;
  error.body = body;
  throw error;
}
