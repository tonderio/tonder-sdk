import { BaseInlineCheckout } from "./BaseInlineCheckout";
import {
  fetchCustomerAPMs,
  fetchCustomerCards,
  saveCustomerCard,
  removeCustomerCard,
  registerOrFetchCustomer,
} from "../data";
import { getSkyflowTokens } from "../helpers/skyflow";
import { getPaymentMethodDetails } from "../shared/catalog/paymentMethodsCatalog";
import { formatPublicErrorResponse, getCardType } from "../helpers/utils";
import { MESSAGES } from "../shared/constants/messages";

export class LiteInlineCheckout extends BaseInlineCheckout {
  #customerData;
  constructor({ mode = "stage", apiKey, returnUrl, callBack = () => {}, signatures }) {
    super({ mode, apiKey, returnUrl, callBack, signatures });
  }

  /**
   * Initializes and prepares the checkout for use.
   * This method set up the initial environment.
   * @returns {Promise<void>} A promise that resolves when the checkout has been initialized.
   * @throws {Error} If there's any problem during the checkout initialization.
   * @public
   */
  async injectCheckout() {
    await this._initializeCheckout();
  }

  /**
   * Retrieves the list of cards associated with a customer.
   * @returns {Promise<import("../../types").ICustomerCardsResponse>} A promise that resolves with the customer's card data.
   *
   * @throws {import("../../types").IPublicError} Throws an error object if the operation fails.
   *
   * @public
   */
  async getCustomerCards() {
    try {
      const { auth_token } = await this.#getCustomer();
      const response = await fetchCustomerCards(
        this.signatures,
        this.baseUrl,
        auth_token,
        this.secureToken,
        this.merchantData.business.pk,
      );
      return {
        ...response,
        cards: response.cards.map(ic => ({
          ...ic,
          icon: getCardType(ic.fields.card_scheme),
        })),
      };
    } catch (error) {
      throw formatPublicErrorResponse(
        {
          message: MESSAGES.getCardsError,
        },
        error,
      );
    }
  }

  /**
   * Saves a card to a customer's account. This method can be used to add a new card
   * or update an existing one.
   * @param {import("../../types").ISaveCardRequest} card - The card information to be saved.
   * @returns {Promise<import("../../types").ISaveCardResponse>} A promise that resolves with the saved card data.
   *
   * @throws {import("../../types").IPublicError} Throws an error object if the operation fails.
   *
   * @public
   */
  async saveCustomerCard(card) {
    try {
      const { auth_token } = await this.#getCustomer();
      const { vault_id, vault_url, business } = this.merchantData;

      const skyflowTokens = await getSkyflowTokens({
        vault_id: vault_id,
        vault_url: vault_url,
        data: card,
        baseUrl: this.baseUrl,
        apiKey: this.apiKeyTonder,
      });

      return await saveCustomerCard(
        this.signatures,
        this.baseUrl,
        auth_token,
        this.secureToken,
        business?.pk,
        skyflowTokens,
      );
    } catch (error) {
      throw formatPublicErrorResponse(
        {
          message: MESSAGES.saveCardError,
        },
        error,
      );
    }
  }

  /**
   * Removes a card from a customer's account.
   * @param {string} skyflowId - The unique identifier of the card to be deleted.
   * @returns {Promise<string>} A promise that resolves when the card is successfully deleted.
   *
   * @throws {import("../../types").IPublicError} Throws an error object if the operation fails.
   *
   * @public
   */
  async removeCustomerCard(skyflowId) {
    try {
      const { auth_token } = await this.#getCustomer();
      const { business } = this.merchantData;

      return await removeCustomerCard(
        this.signatures,
        this.baseUrl,
        auth_token,
        this.secureToken,
        skyflowId,
        business?.pk,
      );
    } catch (error) {
      throw formatPublicErrorResponse(
        {
          message: MESSAGES.removeCardError,
        },
        error,
      );
    }
  }

  /**
   * Retrieves the list of available Alternative Payment Methods (APMs).
   * @returns {Promise<import("../../types").IPaymentMethod[]>} A promise that resolves with the list of APMs.
   *
   * @throws {import("../../types").IPublicError} Throws an error object if the operation fails.
   *
   * @public
   */
  async getCustomerPaymentMethods() {
    try {
      const response = await fetchCustomerAPMs(this.baseUrl, this.apiKeyTonder);

      const apms_results =
        response && "results" in response && response["results"].length > 0
          ? response["results"]
          : [];

      return apms_results
        .filter(apmItem => apmItem.category.toLowerCase() !== "cards")
        .map(apmItem => {
          const apm = {
            id: apmItem.pk,
            payment_method: apmItem.payment_method,
            priority: apmItem.priority,
            category: apmItem.category,
            ...getPaymentMethodDetails(apmItem.payment_method),
          };
          return apm;
        })
        .sort((a, b) => a.priority - b.priority);
    } catch (error) {
      throw formatPublicErrorResponse(
        {
          message: MESSAGES.getPaymentMethodsError,
        },
        error,
      );
    }
  }

  _setCartTotal(total) {
    this.cartTotal = total;
  }

  async _checkout({ card, payment_method }) {
    const customer = await this._getCustomer(this.customer, this.abortController.signal);
    const { vault_id, vault_url } = this.merchantData;
    let skyflowTokens;
    if (!payment_method || payment_method === "" || payment_method === null) {
      if (typeof card === "string") {
        skyflowTokens = {
          skyflow_id: card,
        };
      } else {
        skyflowTokens = await getSkyflowTokens({
          vault_id: vault_id,
          vault_url: vault_url,
          data: { ...card, card_number: card.card_number.replace(/\s+/g, "") },
          baseUrl: this.baseUrl,
          apiKey: this.apiKeyTonder,
        });
      }
    }

    return await this._handleCheckout({
      card: skyflowTokens,
      payment_method,
      customer,
    });
  }

  async #getCustomer() {
    if (!!this.#customerData) return this.#customerData;

    this.#customerData = await registerOrFetchCustomer(
      this.baseUrl,
      this.apiKeyTonder,
      this.customer,
    );
    return this.#customerData;
  }
}
