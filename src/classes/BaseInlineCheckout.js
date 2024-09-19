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
  constructor({ mode = "stage", apiKey, returnUrl, callBack = () => {} }) {
    this.apiKeyTonder = apiKey;
    this.returnUrl = returnUrl;
    this.callBack = callBack;
    this.mode = mode;
    this.baseUrl = TONDER_URL_BY_MODE[this.mode] || TONDER_URL_BY_MODE["stage"];
    this.abortController = new AbortController();
    this.process3ds = new ThreeDSHandler({
      apiKey: apiKey,
      baseUrl: this.baseUrl,
    });
  }

  /**
   * The configureCheckout function allows you to set initial information, such as the customer's email, which is used to retrieve a list of saved cards.
   * @param {import("../../types").IConfigureCheckout} data - Configuration data including customer information and potentially other settings.
   * @returns {void}.
   * @public
   */
  configureCheckout(data) {
    if ("customer" in data) this.#handleCustomer(data["customer"]);
    if ("secureToken" in data) this.#handleSecureToken(data["secureToken"]);
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
    globalLoader.remove();
    return this.#handle3dsRedirect(resultCheckout);
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
      try {
        this.#handleCustomer(data.customer);
        this.#handleSecureToken(data.secureToken);
        this._setCartTotal(data.cart?.total);
        this.#setCartItems(data.cart?.items);
        this.#handleMetadata(data);
        this.#handleCurrency(data);
        this.#handleCard(data);
        const response = await this._checkout(data);
        this.process3ds.setPayload(response);
        this.callBack(response);
        const payload = await this.#handle3dsRedirect(response);
        if (payload) {
          resolve(response);
        }
      } catch (error) {
        reject(error);
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
    return await registerOrFetchCustomer(
      this.baseUrl,
      this.apiKeyTonder,
      customer,
      signal,
    );
  }

  async _checkout() {
    throw new Error(
      "The #checkout method should be implement in child classes.",
    );
  }

  _setCartTotal(total) {
    throw new Error(
      "The #setCartTotal method should be implement in child classes.",
    );
  }

  async _handleCheckout({ card, payment_method, customer }) {
    const { openpay_keys, reference, business } = this.merchantData;
    const total = Number(this.cartTotal);
    try {
      let deviceSessionIdTonder;
      if (
        !deviceSessionIdTonder &&
        openpay_keys.merchant_id &&
        openpay_keys.public_key
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
      };
      const jsonResponseOrder = await createOrder(
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
      };
      const jsonResponsePayment = await createPayment(
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
        metadata: this.metadata,
        browser_info: getBrowserInfo(),
        currency: this.currency,
        ...(!!payment_method ? { payment_method } : { card }),
        ...(typeof MP_DEVICE_SESSION_ID !== "undefined"
          ? { mp_device_session_id: MP_DEVICE_SESSION_ID }
          : {}),
      };

      const jsonResponseRouter = await startCheckoutRouter(
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
    if (response?.decline?.error_type === "Hard") {
      return response;
    }

    if (["Success", "Authorized"].includes(response?.transaction_status)) {
      return response;
    }

    if (response) {
      globalLoader.show();
      const routerItems = {
        checkout_id: response?.checkout?.id,
      };
      try {
        return await startCheckoutRouter(
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

  #handleMetadata(data) {
    this.metadata = data?.metadata;
  }

  #handleCurrency(data) {
    this.currency = data?.currency;
  }

  #handleCard(data) {
    this.card = data?.card;
  }

  #setCartItems(items) {
    this.cartItems = items;
  }

  async #handle3dsRedirect(response) {
    const iframe = response?.next_action?.iframe_resources?.iframe;

    if (iframe) {
      this.process3ds
        .loadIframe()
        .then(() => {
          //TODO: Check if this will be necessary on the frontend side
          // after some the tests in production, since the 3DS process
          // doesn't works properly on the sandbox environment
          // setTimeout(() => {
          //   process3ds.verifyTransactionStatus();
          // }, 10000);
          this.process3ds.verifyTransactionStatus();
        })
        .catch((error) => {
          console.log("Error loading iframe:", error);
        });
    } else {
      const redirectUrl = this.process3ds.getRedirectUrl();
      if (redirectUrl) {
        this.process3ds.redirectToChallenge();
      } else {
        return response;
      }
    }
  }
}
