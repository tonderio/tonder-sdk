import { cardTemplate } from '../helpers/template.js'
import {
  getBusiness,
  customerRegister,
  createOrder,
  createPayment,
  startCheckoutRouter,
  getOpenpayDeviceSessionID
} from '../data/api';
import {
  showError,
  getBrowserInfo,
} from '../helpers/utils';
import { initSkyflow } from '../helpers/skyflow'
import { ThreeDSHandler } from './3dsHandler.js';


export class InlineCheckout {
  static injected = false;
  customer = {}
  items = []
  baseUrl = process.env.BASE_URL || "http://localhost:8000";
  collectContainer = null
  merchantData = {}
  cartTotal = null
  metadata = {}

  constructor  ({
    apiKey,
    returnUrl,
    successUrl,
    renderPaymentButton = false,
    callBack = () => {},
    styles,
  }) {
    this.apiKeyTonder = apiKey;
    this.returnUrl = returnUrl;
    this.successUrl = successUrl;
    this.renderPaymentButton = renderPaymentButton;
    this.callBack = callBack;
    this.customStyles = styles

    this.abortController = new AbortController()
    this.process3ds = new ThreeDSHandler(
      { apiKey: apiKey, baseUrl: this.baseUrl, successUrl: successUrl }
    )
  }

  #mountPayButton() {
    if (!this.renderPaymentButton) return;

    const payButton = document.querySelector("#tonderPayButton");
    if (!payButton) {
      console.error("Pay button not found");
      return;
    }

    payButton.style.display = "block";
    payButton.textContent = `Pagar $${this.cartTotal}`;
    payButton.onclick = async (event) => {
      event.preventDefault();
      await this.#handlePaymentClick(payButton);
    };
  }

  async #handlePaymentClick(payButton) {
    const prevButtonContent = payButton.innerHTML;
    payButton.innerHTML = `<div class="lds-dual-ring"></div>`;
    try {
      const response = await this.payment(this.customer);
      this.callBack(response);
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      payButton.innerHTML = prevButtonContent;
    }
  }

  payment(data) {
    return new Promise(async (resolve, reject) => {
      try {
        this.#handleCustomer(data.customer)
        this.setCartTotal(data.cart?.total)
        this.setCartItems(data.cart?.items)
        this.#handleMetadata(data)
        this.#handleCurrency(data)
        const response = await this.#checkout()
        if (response) {
          const process3ds = new ThreeDSHandler({ 
            baseUrl: this.baseUrl,
            apiKey: this.apiKeyTonder,
            payload: response,
          });
          this.callBack(response);

          if (process3ds.loadIframe()) {
            await process3ds.verifyTransactionStatus();
          } else {
            if (!process3ds.redirectTo3DS()) {
              resolve(response);
            } else {
              resolve(response);
            }
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  #handleCustomer(customer) {
    console.log('customer: ', customer)
    if (!customer) return

    this.firstName = customer?.firstName
    this.lastName = customer?.lastName
    this.country = customer?.country
    this.address = customer?.street
    this.city = customer?.city
    this.state = customer?.state
    this.postCode = customer?.postCode
    this.email = customer?.email
    this.phone = customer?.phone
  }

  #handleMetadata(data) {
    this.metadata = data?.metadata
  }

  #handleCurrency(data) {
    this.currency = data?.currency
  }

  setCartItems (items) {
    console.log('items: ', items)
    this.cartItems = items
  }

  setCartTotal (total) {
    console.log('total: ', total)
    this.cartTotal = total
    this.#updatePayButton()
  }

  #updatePayButton() {
    const payButton = document.querySelector("#tonderPayButton");
    if (!payButton) return
    payButton.textContent = `Pagar $${this.cartTotal}`;
  }

  setCallback (cb) {
    this.cb = cb
  }

  injectCheckout() {
    if (InlineCheckout.injected) return
    this.process3ds.verifyTransactionStatus()
    const injectInterval = setInterval(() => {
      if (document.querySelector("#tonder-checkout")) {
        document.querySelector("#tonder-checkout").innerHTML = cardTemplate;
        this.#mountTonder();
        clearInterval(injectInterval);
        InlineCheckout.injected = true
      }
    }, 500);
  }

  async #fetchMerchantData() {
    this.merchantData = await getBusiness(
      this.baseUrl,
      this.apiKeyTonder,
      this.abortController.signal
    );
    return this.merchantData
  }

  async getCustomer(email, signal) {
    return await customerRegister(this.baseUrl, this.apiKeyTonder, email, signal);
  }

  async #mountTonder() {
    this.#mountPayButton()

    const {
      vault_id,
      vault_url,
    } = await this.#fetchMerchantData();

    this.collectContainer = await initSkyflow(
      vault_id,
      vault_url,
      this.baseUrl,
      this.apiKeyTonder,
      this.abortController.signal,
      this.customStyles,
    );
  }

  removeCheckout() {
    InlineCheckout.injected = false
    // Cancel all requests
    this.abortController.abort(); 
    this.abortController = new AbortController();

    clearInterval(this.injectInterval);
    console.log("InlineCheckout removed from DOM and cleaned up.");
  }

  async #checkout() {
    try {
      document.querySelector("#tonderPayButton").disabled = true;
    } catch (error) {
    }

    const { openpay_keys, reference, business } = this.merchantData
    const total = Number(this.cartTotal)

    var cardTokensSkyflowTonder = null;
    try {
      const collectResponseSkyflowTonder = await this.collectContainer.collect();
      cardTokensSkyflowTonder = await collectResponseSkyflowTonder["records"][0]["fields"];
    } catch (error) {
      showError("Por favor, verifica todos los campos de tu tarjeta")
      throw error;
    }

    try {
      let deviceSessionIdTonder;
      if (openpay_keys.merchant_id && openpay_keys.public_key) {
        deviceSessionIdTonder = await getOpenpayDeviceSessionID(
          openpay_keys.merchant_id,
          openpay_keys.public_key,
          this.abortController.signal
        );
      }

      const { auth_token } = await this.getCustomer(this.email, this.abortController.signal);

      var orderItems = {
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
      console.log('orderItems: ', orderItems)
      const jsonResponseOrder = await createOrder(
        this.baseUrl,
        this.apiKeyTonder,
        orderItems
      );

      // Create payment
      const now = new Date();
      const dateString = now.toISOString();

      var paymentItems = {
        business_pk: business.pk,
        amount: total,
        date: dateString,
        order: jsonResponseOrder.id,
      };
      const jsonResponsePayment = await createPayment(
        this.baseUrl,
        this.apiKeyTonder,
        paymentItems
      );

      // Checkout router
      const routerItems = {
        card: cardTokensSkyflowTonder,
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
        source: 'sdk',
        metadata: this.metadata,
        browser_info: getBrowserInfo(),
        currency: this.currency,
      };
      const jsonResponseRouter = await startCheckoutRouter(
        this.baseUrl,
        this.apiKeyTonder,
        routerItems
      );

      if (jsonResponseRouter) {
        try {
          document.querySelector("#tonderPayButton").disabled = false;
        } catch {}
        return jsonResponseRouter;
      } else {
        showError("No se ha podido procesar el pago")
        return false;
      }
    } catch (error) {
      console.log(error);
      showError("Ha ocurrido un error")
      throw error;
    }
  };
}
