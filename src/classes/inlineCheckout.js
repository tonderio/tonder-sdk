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
    customer,
    items,
    returnUrl,
    // TODO: Fix this
    baseUrl = "https://stage.tonder.io",
    // baseUrl = "http://localhost:8000",
    cartTotal,
    renderPaymentButton=false,
    cb=()=>{},
  }) {
    this.abortController = new AbortController()
    this.baseUrlTonder = baseUrl;
    this.apiKeyTonder = apiKey;
    this.returnUrl = returnUrl;
    this.email = "customer@mail.com";
    this.cartItems = items || [
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
    this.firstName = customer?.firstName || "Unknown";
    this.lastName = customer?.lastName || "Customer";
    this.country = customer?.country || "Mexico";
    this.address = customer?.address || "Unkown street";
    this.city = customer?.city || "Unkown";
    this.state = customer?.state || "Unkown";
    this.postCode = customer?.postCode || "00000";
    this.email = customer?.email || "customer@mail.com";
    this.phone = customer?.phone || "9999999999";
    this.customer = customer
    this.renderPaymentButton = renderPaymentButton
    this.form = form;
    this.radioName = radioName;
    this.process3ds = new ThreeDSHandler({apiKey: apiKey, baseUrl: baseUrl});
    this.collectContainer = null;
    this.merchantData = {}
    this.cartTotal = cartTotal
    this.cb = cb
  }

  mountPayButton() {
    if (this.renderPaymentButton) {
      const payButton = document.querySelector("#tonderPayButton");
      payButton.style.display = "block";
      payButton.textContent = `Pagar $${this.cartTotal}`;
      payButton.addEventListener("click", async (event) => {
        event.preventDefault();
        const prevButtonContent = payButton.innerHTML;
        payButton.innerHTML = `<div class="lds-dual-ring"></div>`;
        await this.payment(this.customer);
        payButton.innerHTML = prevButtonContent;
      });
    }
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

payment(data) {
  return new Promise(async (resolve, reject) => {
    try {
      this.handleFormData(data);
      const response = await this.checkout();
      if (response) {
        const process3ds = new ThreeDSHandler({ payload: response });
        this.cb(response);
        if (!process3ds.redirectTo3DS()) {
          resolve(response);
        } else {
          resolve(response);
        }
      }
    } catch (error) {
      reject(error);
    }
  });
}

  handleFormData(customer) {
    console.log('customer: ', customer)
    if (customer) {
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
  }

  setCartItems (items) {
    console.log('items: ', items)
    this.cartItems = items
  }

  setCartTotal (total) {
    console.log('total: ', total)
    this.cartTotal = total
    this.updatePayButton()
  }

  updatePayButton() {
    const payButton = document.querySelector("#tonderPayButton");
    if (payButton) {
      payButton.textContent = `Pagar $${this.cartTotal}`;
    }
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
    this.abortController = new AbortController();

    clearInterval(this.injectInterval);
    this.form = null;
    this.radioName = null;
    console.log("InlineCheckout removed from DOM and cleaned up.");
  }

  async checkout() {
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
      const jsonResponsePayment = await createPayment(
        this.baseUrlTonder,
        this.apiKeyTonder,
        paymentItems
      );

      // Checkout router
      const routerItems = {
        card: cardTokensSkyflowTonder,
        name: cardTokensSkyflowTonder.cardholder_name,
        last_name: "",
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
      };
      const jsonResponseRouter = await startCheckoutRouter(
        this.baseUrlTonder,
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