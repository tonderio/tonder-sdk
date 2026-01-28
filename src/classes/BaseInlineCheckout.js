import { ThreeDSHandler } from "./3dsHandler.js";
import {
  createOrder,
  fetchBusiness,
  getOpenpayDeviceSessionID,
  registerOrFetchCustomer,
} from "../data";
import { TONDER_URL_BY_MODE } from "../shared/constants/tonderUrl";
import { globalLoader } from "./globalLoader";
import { createPayment, startCheckoutRouter } from "../data/checkoutApi";
import { getBrowserInfo, injectMercadoPagoSecurity } from "../helpers/utils";

export class BaseInlineCheckout {
  baseUrl = "";
  cartTotal = "0";
  secureToken = "";
  signatures = {};
  #isProcessingPayment = false;
  constructor({ mode = "stage", apiKey, returnUrl, callBack = () => {}, signatures }) {
    this.apiKeyTonder = apiKey;
    this.returnUrl = returnUrl;
    this.callBack = callBack;
    this.#handleSignatures(signatures);
    this.mode = mode;
    this.baseUrl = TONDER_URL_BY_MODE[this.mode] || TONDER_URL_BY_MODE["stage"];
    this.abortController = new AbortController();
    this.process3ds = new ThreeDSHandler({
      apiKey: apiKey,
      baseUrl: this.baseUrl,
      mode: this.mode,
    });
  }

  /**
   * The configureCheckout function allows you to set initial information, such as the customer's email, which is used to retrieve a list of saved cards.
   * @param {import("../../types").IConfigureCheckout} data - Configuration data including customer information and potentially other settings.
   * @returns {void}.
   * @public
   */
  configureCheckout(data) {
    if ("secureToken" in data) this.#handleSecureToken(data["secureToken"]);
    this.#setCheckoutData(data);
  }

  /**
   * Verifies the 3DS transaction status.
   * @returns {Promise<import("../../types").ITransaction | void>} The result of the 3DS verification and checkout resumption.
   * @public
   */
  async verify3dsTransaction() {
    globalLoader.show();
    const result3ds = await this.process3ds.verifyTransactionStatus();
    const resultCheckout = await this.#resumeCheckout(result3ds);
    this.process3ds.setPayload(resultCheckout);
    const response = await this.#handle3dsRedirect(resultCheckout);
    globalLoader.remove();
    return response;
  }

  /**
   * Processes a payment.
   * @param {import("../../types").IProcessPaymentRequest} data - Payment data including customer, cart, and other relevant information.
   * @returns {Promise<import("../../types").IStartCheckoutResponse>} A promise that resolves with the payment response or 3DS redirect or is rejected with an error.
   *
   * @throws {Error} Throws an error if the checkout process fails. The error object contains
   * additional `details` property with the response from the server if available.
   * @property {import("../../types").IStartCheckoutErrorResponse} error.details - The response body from the server when an error occurs.
   *
   * @public
   */
  payment(data) {
    return new Promise(async (resolve, reject) => {
      // Prevent multiple concurrent payment requests
      // Silently ignore duplicate clicks without throwing an error
      if (this.#isProcessingPayment) {
        console.warn("[Tonder SDK] Payment already in progress, ignoring duplicate request");
        return;
      }

      this.#isProcessingPayment = true;

      try {
        this.#setCheckoutData(data);
        const response = await this._checkout(data);
        this.process3ds.setPayload(response);
        const result = await this.#handle3dsRedirect(response);
        if (result) {
          resolve(result);
        }
      } catch (error) {
        reject(error);
      } finally {
        // Reset the flag after payment completes (success or error)
        this.#isProcessingPayment = false;
      }
    });
  }

  async _initializeCheckout() {
    const { mercado_pago } = await this.#fetchMerchantData();

    if (!!mercado_pago && !!mercado_pago.active) {
      injectMercadoPagoSecurity();
    }
  }

  async _getCustomer(customer, signal) {
    return await registerOrFetchCustomer(this.baseUrl, this.apiKeyTonder, customer, signal);
  }

  async _checkout() {
    throw new Error("The #checkout method should be implement in child classes.");
  }

  _setCartTotal(total) {
    throw new Error("The #setCartTotal method should be implement in child classes.");
  }

  async _handleCheckout({ card, payment_method, customer }) {
    const { openpay_keys, reference, business } = this.merchantData;
    const total = Number(this.cartTotal);
    try {
      let deviceSessionIdTonder;
      if (
        !deviceSessionIdTonder &&
        openpay_keys.merchant_id &&
        openpay_keys.public_key &&
        !payment_method
      ) {
        deviceSessionIdTonder = await getOpenpayDeviceSessionID(
          openpay_keys.merchant_id,
          openpay_keys.public_key,
          this.abortController.signal,
        );
      }

      const { id, auth_token } = customer;
      const orderItems = {
        business: this.apiKeyTonder,
        client: auth_token,
        billing_address_id: null,
        shipping_address_id: null,
        amount: total,
        status: "A",
        reference: reference,
        is_oneclick: true,
        items: this.cartItems,
        currency: this.currency,
        metadata: this.metadata,
      };
      const jsonResponseOrder = await createOrder(
        this.signatures,
        this.baseUrl,
        this.apiKeyTonder,
        orderItems,
      );

      // Create payment
      const now = new Date();
      const dateString = now.toISOString();

      const paymentItems = {
        business_pk: business.pk,
        client_id: id,
        amount: total,
        date: dateString,
        order_id: jsonResponseOrder.id,
        customer_order_reference: this.order_reference ? this.order_reference : reference,
        items: this.cartItems,
        currency: this.currency,
        metadata: this.metadata,
      };
      const jsonResponsePayment = await createPayment(
        this.signatures,
        this.baseUrl,
        this.apiKeyTonder,
        paymentItems,
      );

      // Checkout router
      const routerItems = {
        name: this.firstName || "",
        last_name: this.lastName || "",
        email_client: this.email,
        phone_number: this.phone,
        return_url: this.returnUrl,
        id_product: "no_id",
        quantity_product: 1,
        id_ship: "0",
        instance_id_ship: "0",
        amount: total,
        title_ship: "shipping",
        description: "transaction",
        device_session_id: deviceSessionIdTonder ? deviceSessionIdTonder : null,
        token_id: "",
        order_id: jsonResponseOrder.id,
        business_id: business.pk,
        payment_id: jsonResponsePayment.pk,
        source: "sdk",
        items: this.cartItems,
        metadata: this.metadata,
        browser_info: getBrowserInfo(),
        currency: this.currency,
        ...(this.customer?.identification ? { identification: this.customer.identification } : {}),
        ...(!!payment_method ? { payment_method } : { card }),
        ...(typeof MP_DEVICE_SESSION_ID !== "undefined"
          ? { mp_device_session_id: MP_DEVICE_SESSION_ID }
          : {}),
        apm_config: this.#buildApmConfig(payment_method),
      };

      const jsonResponseRouter = await startCheckoutRouter(
        this.signatures,
        this.baseUrl,
        this.apiKeyTonder,
        routerItems,
      );

      if (jsonResponseRouter) {
        return jsonResponseRouter;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  #setCheckoutData(data) {
    if (!data) return;
    this.#handleCustomer(data.customer);
    this._setCartTotal(data.cart?.total);
    this.#setCartItems(data.cart?.items);
    this.#handleMetadata(data);
    this.#handleCurrency(data);
    this.#handleCard(data);
    this.#handleApmConfig(data);
  }

  async #fetchMerchantData() {
    this.merchantData = await fetchBusiness(
      this.baseUrl,
      this.apiKeyTonder,
      this.abortController.signal,
    );
    return this.merchantData;
  }

  async #resumeCheckout(response) {
    // Stop the routing process if the transaction is either hard declined or successful
    if (
      response?.decline?.error_type === "Hard" ||
      !!response?.checkout?.is_route_finished ||
      !!response?.is_route_finished ||
      ["Pending"].includes(response?.transaction_status)
    ) {
      return response;
    }

    if (["Success", "Authorized"].includes(response?.transaction_status)) {
      return response;
    }

    if (response) {
      globalLoader.show();
      const routerItems = {
        checkout_id: response?.checkout?.id || response?.checkout_id,
      };
      try {
        return await startCheckoutRouter(
          this.signatures,
          this.baseUrl,
          this.apiKeyTonder,
          routerItems,
        );
      } catch (error) {
        // throw error
      } finally {
        globalLoader.remove();
      }
      return response;
    }
  }

  #handleCustomer(customer) {
    if (!customer) return;

    this.firstName = customer?.firstName;
    this.lastName = customer?.lastName;
    this.country = customer?.country;
    this.address = customer?.street;
    this.city = customer?.city;
    this.state = customer?.state;
    this.postCode = customer?.postCode;
    this.email = customer?.email;
    this.phone = customer?.phone;
    this.customer = customer;
  }

  #handleSecureToken(secureToken) {
    this.secureToken = secureToken;
  }

  #handleSignatures(signatures) {
    this.signatures = signatures;
  }

  #handleMetadata(data) {
    this.metadata = data?.metadata;
    this.order_reference = data?.order_reference;
  }

  #handleCurrency(data) {
    this.currency = data?.currency;
  }

  #handleCard(data) {
    this.card = data?.card;
  }

  #handleApmConfig(data) {
    this.apm_config = data?.apm_config;
  }

  #buildApmConfig(payment_method) {
    if (this.apm_config) {
      return this.apm_config;
    }

    if (payment_method && this.#isSafetyPayMethod(payment_method)) {
      return this.#buildSafetyPayApmConfig(payment_method);
    }

    return this.apm_config || {};
  }

  #isSafetyPayMethod(paymentMethod) {
    return (
      paymentMethod &&
      (paymentMethod.toLowerCase().includes("safetypay") ||
        paymentMethod.toLowerCase() === "safetypaycash" ||
        paymentMethod.toLowerCase() === "safetypaytransfer")
    );
  }

  #buildSafetyPayApmConfig(paymentMethod) {
    const selectedBank = this.getSelectedSafetyPayBank?.() || null;

    if (!selectedBank) {
      console.warn("SafetyPay payment attempted but no bank selected, using provided apm_config");
      // Return user's apm_config if available, otherwise empty object
      return this.apm_config || {};
    }
    const channel = paymentMethod.toLowerCase().includes("cash") ? "WP" : "OL";

    const bankInfo = this.getSafetyPayBankInfo(selectedBank);

    const country = bankInfo?.country_name || "México";

    return {
      country: country,
      channel: channel,
      bank_ids: [
        {
          id: selectedBank.bankCode,
        },
      ],
    };
  }
  getSafetyPayBankInfo(selectedBank) {
    return null;
  }

  #setCartItems(items) {
    this.cartItems = items;
  }

  async #handle3dsRedirect(response) {
    console.log("Handling 3DS redirect...");
    const iframe = response?.next_action?.iframe_resources?.iframe;
    const threeDsChallenge = response?.next_action?.three_ds_challenge;

    if (iframe) {
      try {
        await this.process3ds.loadIframe();
        const res = await this.process3ds.verifyTransactionStatus();
        return res;
      } catch (error) {
        console.log("Error loading iframe:", error);
      }
    } else if (threeDsChallenge) {
      await this.process3ds.handle3dsChallenge(threeDsChallenge);
      const res = await this.process3ds.verifyTransactionStatus();
      return res;
    } else {
      const redirectUrl = this.process3ds.getRedirectUrl();
      if (redirectUrl) {
        this.process3ds.redirectToChallenge();
      } else {
        return response;
      }
    }
  }

  getSelectedSafetyPayBank() {
    return null;
  }
}
