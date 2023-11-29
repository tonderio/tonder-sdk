import { cardTemplate } from '../helpers/template.js'
import {
  getBusiness,
  customerRegister,
  createOrderTonder,
  createPaymentTonder,
  createCheckoutRouterTonder,
  getOpenpayDeviceSessionID
} from '../data/api';

import {
  addScripts,
  toCurrency,
  filtrarNumeros,
  showError
} from '../helpers/utils';

import { initSkyflow } from '../helpers/skyflow'

import { ThreeDSHandler } from './3dsHandler.js';

export class InlineCheckout {
  static injected = false;

  constructor({
    form,
    radioName,
    apiKey,
    totalElementId,
    customer,
    items,
    returnUrl,
    // TODO: Fix this
    baseUrl = "https://stage.tonder.io",
    cb=()=>{},
  }) {
    this.abortController = new AbortController()
    this.baseUrlTonder = baseUrl;
    this.apiKeyTonder = apiKey;
    this.returnUrl = returnUrl;
    this.email = "customer@mail.com";
    this.cartItemsTonder = items || [
      {
        description: "Example",
        quantity: 1,
        price_unit: 1,
        discount: 0,
        taxes: 0,
        product_reference: 1,
        name: "Producto",
        amount_total: 1,
      },
    ];
    this.totalElementId = totalElementId;
    this.firstName = customer?.firstName || "Unknown";
    this.lastName = customer?.lastName || "Customer";
    this.country = customer?.country || "Mexico";
    this.address = customer?.address || "Unkown street";
    this.city = customer?.city || "Unkown";
    this.state = customer?.state || "Unkown";
    this.postCode = customer?.postCode || "00000";
    this.email = customer?.email || "customer@mail.com";
    this.phone = customer?.phone || "9999999999";
    this.form = form;
    this.radioName = radioName;
    this.process3ds = new ThreeDSHandler({apiKey: apiKey, baseUrl: baseUrl});
    this.collectContainer = null;
    this.merchantData = {}
    this.cb = cb

    addScripts();
  }

  getInfoFromElements() {
    const payButton = document.querySelector("#tonderPayButton");
    const totalElement = document.getElementById("cart-total");
    this.total = filtrarNumeros(totalElement.textContent);
    payButton.textContent = `Pagar $${this.total}`;
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          this.total = filtrarNumeros(totalElement.textContent);
          payButton.textContent = `Pagar ${toCurrency(this.total)}`;
        }
      });
    });

    mutationObserver.observe(totalElement, {
      subtree: true,
      characterData: true,
    });
  }

  mountPayButton() {
    const payButton = document.querySelector("#tonderPayButton");
    payButton.addEventListener("click", async (event) => {
      event.preventDefault();
      const prevButtonContent = payButton.innerHTML;
      payButton.innerHTML = `<div class="lds-dual-ring"></div>`;
      const response = await this.payment();
      payButton.innerHTML = prevButtonContent;
      if (response) {
        const process3ds = new ThreeDSHandler({payload: response})
        this.cb(response)
        if (!process3ds.redirectTo3DS()) {
          if (this.form) {
            this.form.submit()
          }
        }
      }
    });
  }

  mountRadioElements() {
    if (!this.radioName) {
      document.querySelector(".container-tonder").classList.add("container-selected");
    } else {
      const radios = document.querySelectorAll(`input[type=radio][name=${this.radioName}]`);
      radios.forEach((radio) =>
        radio.addEventListener("change", () => {
          console.log(radio);
          if (radio.id === "tonder-pay") {
            document.querySelector(".container-tonder").classList.add("container-selected");
          } else {
            document.querySelector(".container-tonder").classList.remove("container-selected");
          }
        })
      );
    }
  }

  injectCheckout() {
    if (InlineCheckout.injected) return
    this.process3ds.verifyTransactionStatus()
    const injectInterval = setInterval(() => {
      if (document.querySelector("#tonder-checkout")) {
        document.querySelector("#tonder-checkout").innerHTML = cardTemplate;
        this.mountTonder();
        clearInterval(injectInterval);
        InlineCheckout.injected = true
      }
    }, 500);
  }

  async fetchMerchantData() {
    this.merchantData = await getBusiness(
      this.baseUrlTonder,
      this.apiKeyTonder,
      this.abortController.signal
    );
    return this.merchantData
  }

  async getCustomer(email, signal) {
    return await customerRegister(this.baseUrlTonder, this.apiKeyTonder, email, signal);
  }

  async mountTonder() {
    this.getInfoFromElements();
    this.mountPayButton()
    this.mountRadioElements()

    const {
      vault_id,
      vault_url,
    } = await this.fetchMerchantData();

    this.collectContainer = await initSkyflow(
      vault_id,
      vault_url,
      this.baseUrlTonder,
      this.apiKeyTonder,
      this.abortController.signal
    );
  }

  removeCheckout() {
    InlineCheckout.injected = false
    // Cancel all requests
    this.abortController.abort(); 

    const formElement = document.querySelector("#tonder-checkout");
    if (formElement) {
      formElement.parentNode.removeChild(formElement);
    }
    clearInterval(this.injectInterval);
    this.form = null;
    this.radioName = null;
    console.log("InlineCheckout removed from DOM and cleaned up.");
  }

  async payment() {
    document.querySelector("#tonderPayButton").disabled = true;

    var billingFirstName = this.firstName;
    var billingLastName = this.lastName;
    var billingCountry = this.country;
    var billingAddressOne = this.address;
    var billingCity = this.city;
    var billingState = this.state;
    var billingPostcode = this.postCode;
    var billingEmail = this.email;
    var billingPhone = this.phone;

    if (
      !billingFirstName ||
      !billingLastName ||
      !billingCountry ||
      !billingAddressOne ||
      !billingCity ||
      !billingState ||
      !billingPostcode ||
      !billingEmail ||
      !billingPhone
    ) {
      showError("Verifica los campos obligatorios")
      return false;
    }

    const { openpay_keys, reference, business } = this.merchantData
    const total = this.total;

    var cardTokensSkyflowTonder = null;
    try {
      const collectResponseSkyflowTonder = await this.collectContainer.collect();
      cardTokensSkyflowTonder = await collectResponseSkyflowTonder["records"][0]["fields"];
    } catch (error) {
      showError("Por favor, verifica todos los campos de tu tarjeta")
      return false;
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

      const { auth_token } = await this.getCustomer(billingEmail, this.abortController.signal);

      var orderItems = {
        business: this.apiKeyTonder,
        client: auth_token,
        billing_address_id: null,
        shipping_address_id: null,
        amount: total,
        status: "A",
        reference: reference,
        is_oneclick: true,
        items: this.cartItemsTonder,
      };
      console.log('orderItems: ', orderItems)
      const jsonResponseOrder = await createOrderTonder(
        this.baseUrlTonder,
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
      const jsonResponsePayment = await createPaymentTonder(
        this.baseUrlTonder,
        this.apiKeyTonder,
        paymentItems
      );

      // Checkout router
      const routerItems = {
        card: cardTokensSkyflowTonder,
        name: cardTokensSkyflowTonder.cardholder_name,
        last_name: "",
        email_client: billingEmail,
        phone_number: billingPhone,
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
      };
      const jsonResponseRouter = await createCheckoutRouterTonder(
        this.baseUrlTonder,
        this.apiKeyTonder,
        routerItems
      );

      if (jsonResponseRouter) {
        document.querySelector("#tonderPayButton").disabled = false;
        return jsonResponseRouter;
      } else {
        showError("No se ha podido procesar el pago")
        return false;
      }
    } catch (error) {
      console.log(error);
      showError("Ha ocurrido un error")
      return false;
    }
  };
}