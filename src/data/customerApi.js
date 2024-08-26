/**
 * Registers a new customer or fetches an existing customer.
 * @param {string} baseUrl - The base URL of the  API.
 * @param {string} apiKey - The API key for authentication.
 * @param {Object} customer - The customer data.
 * @param {AbortSignal} signal - The abort signal to cancel the request.
 * @returns {Promise<Object>} The registered or fetched customer data.
 */
export async function registerOrFetchCustomer(
  baseUrl,
  apiKey,
  customer,
  signal = null,
) {
  const url = `${baseUrl}/api/v1/customer/`;
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
      Authorization: `Token ${apiKey}`,
    },
    signal: signal,
    body: JSON.stringify(data),
  });

  if (response.status === 201) {
    return await response.json();
  } else {
    throw new Error(`Error: ${response.statusText}`);
  }
}
