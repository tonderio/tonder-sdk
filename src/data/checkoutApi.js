import { fetchWithSignatureHeaders } from "../shared/utils/apiFetch";

/**
 * Creates a new order in the  system.
 * @param signatures
 * @param {string} baseUrl - The base URL of the  API.
 * @param {string} apiKey - The API key for authentication.
 * @param {Object} orderItems - The items to be included in the order.
 * @returns {Promise<Object>} The created order data.
 */
export async function createOrder(signatures, baseUrl, apiKey, orderItems) {
  const url = `${baseUrl}/api/v1/orders/`;
  const response = await fetchWithSignatureHeaders(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify(orderItems),
    },
    signatures,
  );
  if (response.status === 201) {
    return await response.json();
  } else {
    throw new Error(`Error: ${response.statusText}`);
  }
}

/**
 * Creates a new payment in the  system.
 * @param signatures
 * @param {string} baseUrl - The base URL of the  API.
 * @param {string} apiKey - The API key for authentication.
 * @param {Object} paymentItems - The payment details.
 * @returns {Promise<Object>} The created payment data.
 */
export async function createPayment(signatures, baseUrl, apiKey, paymentItems) {
  const url = `${baseUrl}/api/v1/business/${paymentItems.business_pk}/payments/`;
  const response = await fetchWithSignatureHeaders(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify(paymentItems),
    },
    signatures,
  );
  if (response.status >= 200 && response.status <= 299) {
    return await response.json();
  } else {
    throw new Error(`Error: ${response.statusText}`);
  }
}

/**
 * Initiates the checkout process.
 *
 * This function sends a POST request to the checkout router API with the provided
 * checkout details. If the request is successful, it returns the response data.
 * If the request fails, it throws an error that includes the status and details of the failure.
 *
 * @param signatures
 * @param {string} baseUrl - The base URL of the API.
 * @param {string} apiKey - The API key for authentication.
 * @param {import("../../types").IStartCheckoutRequest | import("../../types").IStartCheckoutIdRequest} routerItems - The checkout details to be sent in the request body.
 * @returns {Promise<import("../../types").IStartCheckoutResponse>} The checkout process result.
 *
 * @throws {Error} Throws an error if the checkout process fails. The error object contains
 * additional `details` property with the response from the server if available.
 * @property {import("../../types").IStartCheckoutErrorResponse} error.details - The response body from the server when an error occurs.
 */
export async function startCheckoutRouter(signatures, baseUrl, apiKey, routerItems) {
  try {
    const url = `${baseUrl}/api/v1/checkout-router/`;
    const response = await fetchWithSignatureHeaders(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${apiKey}`,
        },
        body: JSON.stringify(routerItems),
      },
      signatures,
    );
    if (response.status >= 200 && response.status <= 299) {
      return await response.json();
    } else {
      const errorResponse = await response.json();
      const error = new Error("Failed to start checkout router");
      error.details = errorResponse;
      throw error;
    }
  } catch (error) {
    throw error;
  }
}
