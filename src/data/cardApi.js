import {
  buildErrorResponse,
  buildErrorResponseFromCatch,
} from "../helpers/utils";
import {MESSAGES} from "../shared/constants/messages";

/**
 * Saves or updates a customer's card information.
 *
 * This function sends a POST request to save or update the card information for a customer.
 *
 * @param {string} baseUrl - The base URL of the API.
 * @param {string} customerToken - The customer's authentication token.
 * @param {string | number} businessId - The business ID.
 * @param {import("../../types").ISaveCardSkyflowRequest} data - The card information to be saved.
 * @returns {Promise<import("../../types").ISaveCardResponse>} The saved card data.
 *
 * @throws {import("../../types").IApiError} Throws an error object if the save/update operation fails.
 */
export async function saveCustomerCard(
  baseUrl,
  customerToken,
  businessId,
  data,
) {
  try {
    const url = `${baseUrl}/api/v1/business/${businessId}/cards/`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${customerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) return await response.json();

    const res_json = await response.json();
    if (response.status === 409) {
      if ((res_json.error = "Card number already exists.")) {
        return {
          code: 200,
          body: res_json,
          name: "",
          message: res_json.error,
        };
      }
    }
    throw await buildErrorResponse(response, res_json);
  } catch (error) {
    throw buildErrorResponseFromCatch(error);
  }
}

/**
 * Removes a customer's card.
 * @param {string} baseUrl - The base URL of the  API.
 * @param {string} customerToken - The customer's authentication token.
 * @param {string} skyflowId - The Skyflow ID of the card to be removed.
 * @param {string} businessId - The business ID.
 * @returns {Promise<string>} The result of the card removal operation.
 *
 * @throws {import("../../types").IApiError} Throws an error object if the operation fails.
 */
export async function removeCustomerCard(
  baseUrl,
  customerToken,
  skyflowId = "",
  businessId,
) {
  try {
    const url = `${baseUrl}/api/v1/business/${businessId}/cards/${skyflowId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Token ${customerToken}`,
        "Content-Type": "application/json",
      },
    });

    if(response.status === 204) return MESSAGES.cardSaved;
    if (response.ok && "json" in response) return await response.json();
    const res_json = await response.json();

    throw await buildErrorResponse(response, res_json);
  } catch (error) {
    throw buildErrorResponseFromCatch(error);
  }
}

/**
 * Fetches a customer's saved cards.
 * @param {string} baseUrl - The base URL of the  API.
 * @param {string} customerToken - The customer's authentication token.
 * @param {string} businessId - The business ID.
 * @param {AbortSignal} signal - The abort signal to cancel the request.
 * @returns {Promise<import("../../types").ICustomerCardsResponse>} The customer's saved cards.
 *
 * @throws {import("../../types").IApiError} Throws an error object if the operation fails.
 */
export async function fetchCustomerCards(
  baseUrl,
  customerToken,
  businessId,
  signal= null,
) {
  try {
    const url = `${baseUrl}/api/v1/business/${businessId}/cards/`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Token ${customerToken}`,
        "Content-Type": "application/json",
      },
      signal,
    });
    if (response.ok) return await response.json();
    const res_json = await response.json();

    throw await buildErrorResponse(response, res_json, MESSAGES.getCardsError);
  } catch (error) {
    throw buildErrorResponseFromCatch(error, MESSAGES.getCardsError);
  }
}
