import { BaseInlineCheckout } from "./BaseInlineCheckout";
import {
  fetchCustomerAPMs,
  fetchCustomerCards,
  saveCustomerCard,
  removeCustomerCard,
  registerOrFetchCustomer,
} from "../data";
import { initializeSkyflow, mountSkyflowFields, mountRevealFields } from "../helpers/skyflow";
import { getPaymentMethodDetails } from "../shared/catalog/paymentMethodsCatalog";
import { formatPublicErrorResponse, getCardType } from "../helpers/utils";
import { MESSAGES } from "../shared/constants/messages";

export class LiteInlineCheckout extends BaseInlineCheckout {
  #customerData;
  #skyflowInstance = null;
  #mountedElementsByContext = new Map();
  #lastCollectedTokens = null;

  /**
   * @param {object} options
   * @param {string} [options.mode='stage']
   * @param {string} options.apiKey
   * @param {string} [options.returnUrl]
   * @param {Function} [options.callBack]
   * @param {object} [options.signatures]
   * @param {object} [options.customization] - Style/label/placeholder overrides for card fields.
   * @param {object} [options.events] - Per-field event handlers.
   */
  constructor({
    mode = "stage",
    apiKey,
    returnUrl,
    callBack = () => {},
    signatures,
    customization,
    events,
  }) {
    super({ mode, apiKey, returnUrl, callBack, signatures });
    this.customization = customization || {};
    this.events = events || {};
  }

  /**
   * Initializes and prepares the checkout for use.
   * @returns {Promise<void>}
   * @public
   */
  async injectCheckout() {
    await this._initializeCheckout();
  }

  /**
   * Retrieves the list of cards associated with a customer.
   * @returns {Promise<import("../../types").ICustomerCardsResponse>}
   * @throws {import("../../types").IPublicError}
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
          icon: getCardType(ic.fields.card_scheme, false, this.mode),
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
   * Saves a card to a customer's account using data collected from mounted Skyflow Elements.
   * Call mountCardFields() with the required fields before calling this method.
   *
   * @returns {Promise<import("../../types").ISaveCardResponse>}
   * @throws {import("../../types").IPublicError}
   * @public
   */
  async saveCustomerCard() {
    try {
      const { auth_token } = await this.#getCustomer();
      const { business } = this.merchantData;

      const skyflowTokens = await this.#collectCreateCardTokens();

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
   * @returns {Promise<string>}
   * @throws {import("../../types").IPublicError}
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
   * @returns {Promise<import("../../types").IPaymentMethod[]>}
   * @throws {import("../../types").IPublicError}
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
            ...getPaymentMethodDetails(apmItem.payment_method, this.mode),
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

  /**
   * Mounts Skyflow secure iframe inputs into developer-provided containers.
   * Call this before payment() or saveCustomerCard().
   *
   * @param {object} request
   * @param {Array<string|{field: string, container_id?: string}>} request.fields
   * @param {string} [request.card_id] - Skyflow ID for saved-card CVV flow.
   * @param {'all'|'current'|'none'|string} [request.unmount_context='all']
   *   - 'all': unmount all previously mounted contexts before mounting (default)
   *   - 'current': unmount only the same context
   *   - 'none': do not unmount anything
   *   - other string: unmount that specific context key
   * @returns {Promise<void>}
   * @public
   */
  async mountCardFields(request) {
    const context = request.card_id ? `update:${request.card_id}` : "create";
    const unmountContext = request.unmount_context !== undefined ? request.unmount_context : "all";

    if (unmountContext !== "none") {
      this.unmountCardFields(unmountContext === "current" ? context : unmountContext);
    }

    await this.#ensureSkyflowInstance();

    const containerData = await mountSkyflowFields({
      skyflowInstance: this.#skyflowInstance,
      data: request,
      customization: this.customization,
      events: this.events,
    });

    this.#mountedElementsByContext.set(context, {
      elements: containerData.elements || [],
      container: containerData.container,
    });
  }

  /**
   * Unmounts Skyflow elements previously mounted via mountCardFields().
   * @param {string} [context='all'] - 'all' unmounts everything; otherwise unmounts by context key.
   * @public
   */
  unmountCardFields(context = "all") {
    if (context === "all") {
      this.#mountedElementsByContext.forEach((_, ctx) => {
        this.#unmountContext(ctx);
      });
      this.#mountedElementsByContext.clear();
    } else {
      this.#unmountContext(context);
      this.#mountedElementsByContext.delete(context);
    }
  }

  /**
   * Reveals tokenized card data in developer-provided containers using Skyflow Reveal Elements.
   * Must be called after a successful saveCustomerCard() or payment() with a new card.
   * CVV is never revealed (PCI DSS req. 3.2.1).
   *
   * @param {object} request
   * @param {Array<string|{field: string, container_id?: string, altText?: string, label?: string, styles?: object}>} request.fields
   * @param {object} [request.styles] - Global styles applied to all reveal elements.
   * @returns {Promise<void>}
   * @public
   */
  async revealCardFields(request) {
    if (!this.#lastCollectedTokens) {
      throw formatPublicErrorResponse(
        {
          message:
            "No card tokens available. Call saveCustomerCard() or payment() with a new card before calling revealCardFields().",
        },
        { code: 400 },
      );
    }
    if (!this.#skyflowInstance) {
      throw formatPublicErrorResponse(
        {
          message: "Skyflow instance not initialized. Ensure mountCardFields() was called first.",
        },
        { code: 400 },
      );
    }
    await mountRevealFields({
      skyflowInstance: this.#skyflowInstance,
      tokens: this.#lastCollectedTokens,
      request,
    });
  }

  _setCartTotal(total) {
    this.cartTotal = total;
  }

  async _checkout({ card, payment_method }) {
    const customer = await this._getCustomer(this.customer, this.abortController.signal);
    let skyflowTokens;

    if (!payment_method || payment_method === "" || payment_method === null) {
      if (typeof card === "string") {
        // Saved card: use skyflow_id directly; also attempt to collect CVV if a CVV form is mounted
        skyflowTokens = { skyflow_id: card };
        await this.#collectCardTokens(card);
      } else {
        // New card: collect all fields from the 'create' context
        skyflowTokens = await this.#collectCreateCardTokens();
      }
    }

    return await this._handleCheckout({
      card: skyflowTokens,
      payment_method,
      customer,
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  async #ensureSkyflowInstance() {
    if (this.#skyflowInstance) return;
    if (!this.merchantData) {
      await this._initializeCheckout();
    }
    const { vault_id, vault_url } = this.merchantData;
    this.#skyflowInstance = await initializeSkyflow(
      vault_id,
      vault_url,
      this.baseUrl,
      this.apiKeyTonder,
      null,
      this.mode,
    );
  }

  async #collectCreateCardTokens() {
    const contextData = this.#mountedElementsByContext.get("create");
    const container = contextData && contextData.container;
    if (!container) {
      throw formatPublicErrorResponse(
        {
          message:
            "No card fields mounted. Call mountCardFields() with the required fields before proceeding.",
        },
        { code: 400 },
      );
    }
    try {
      const collectResponse = await container.collect();
      const fields =
        (collectResponse &&
          collectResponse.records &&
          collectResponse.records[0] &&
          collectResponse.records[0].fields) ||
        {};
      this.#lastCollectedTokens = fields;
      return fields;
    } catch (e) {
      throw formatPublicErrorResponse(
        {
          message:
            "Error collecting card tokens. Ensure all required fields are filled in correctly.",
        },
        e,
      );
    }
  }

  async #collectCardTokens(cardId) {
    const context = `update:${cardId}`;
    const contextData = this.#mountedElementsByContext.get(context);
    const container = contextData && contextData.container;
    if (!container) return null; // No CVV form mounted for this card — skip silently
    try {
      const collectResponse = await container.collect();
      return (
        (collectResponse &&
          collectResponse.records &&
          collectResponse.records[0] &&
          collectResponse.records[0].fields) ||
        null
      );
    } catch (e) {
      console.warn(`[LiteInlineCheckout] Could not collect CVV for card ${cardId}:`, e);
      return null;
    }
  }

  #unmountContext(context) {
    const contextData = this.#mountedElementsByContext.get(context);
    if (!contextData) return;
    (contextData.elements || []).forEach(element => {
      try {
        if (element && typeof element.unmount === "function") {
          element.unmount();
        }
      } catch (error) {
        console.warn(
          `[LiteInlineCheckout] Error unmounting element from context '${context}':`,
          error,
        );
      }
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
