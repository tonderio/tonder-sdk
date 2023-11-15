import { cardTemplate } from '../helpers/template.js'
import {
  responseBusinessTonder,
  customerRegister,
  createOrderTonder,
  createPaymentTonder,
  createCheckoutRouterTonder,
  openpayCheckoutTonder
} from '../data/api';

import {
  addScripts,
  initSkyflow,
  toCurrency,
  filtrarNumeros,
} from '../helpers/utils';

import { ThreeDSHandler } from './3dsHandler.js';

export class InlineCheckout {
  constructor({
    form,
    radioName,
    apiKey,
    totalElementId,
    customer,
    items,
    returnUrl,
    // TODO: Fix this
    baseUrl = "http://localhost:8000",
  }) {
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
    this.process3ds = new ThreeDSHandler({apiKey: apiKey, baseUrl: baseUrl})

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


  injectCheckout() {
    this.process3ds.verifyTransactionStatus()
    const injectInterval = setInterval(() => {
      if (document.querySelector("#tonder-checkout")) {
        document.querySelector("#tonder-checkout").innerHTML = cardTemplate;
        this.fetchTonderData();
        clearInterval(injectInterval);
      }
    }, 500);
  }

  async fetchTonderData() {
    var checkboxTonder = document.getElementById("acceptTonder");
    checkboxTonder.checked = false;

    // Load inputs
    // Token
    const apiKeyTonder = this.apiKeyTonder;
    const cartItemsTonder = this.cartItemsTonder;
    const baseUrlTonder = this.baseUrlTonder;
    var vaultIdTonder;
    var vaultUrlTonder;
    var referenceTonder;
    var userKeyTonder;
    var businessPkTonder;
    var openpayMerchantIdTonder;
    var openpayPublicKeyTonder;
    this.getInfoFromElements();

    // -- Business' details --
    try {
      const dataBusinessTonder = await responseBusinessTonder(baseUrlTonder, apiKeyTonder);

      // Response data
      vaultIdTonder = dataBusinessTonder.vault_id;
      vaultUrlTonder = dataBusinessTonder.vault_url;
      referenceTonder = dataBusinessTonder.reference;
      businessPkTonder = dataBusinessTonder.business.pk;

      // Openpay
      openpayMerchantIdTonder = dataBusinessTonder.openpay_keys.merchant_id;
      openpayPublicKeyTonder = dataBusinessTonder.openpay_keys.public_key;
    } catch (error) {
      console.log(error);
    }

    const collectContainerTonder = await initSkyflow(vaultIdTonder, vaultUrlTonder, baseUrlTonder, apiKeyTonder)

    const getResponseTonder = async () => {
      // Disable button
      document.querySelector("#tonderPayButton").disabled = true;

      // Data from checkout
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
        var msgErrorDiv = document.getElementById("msgError");
        msgErrorDiv.classList.add("error-tonder-container-tonder");
        msgErrorDiv.innerHTML = "Verifica los campos obligatorios";
        setTimeout(function () {
          document.querySelector("#tonderPayButton").disabled = false;
          msgErrorDiv.classList.remove("error-tonder-container-tonder");
          msgErrorDiv.innerHTML = "";
        }, 3000);
        return false;
      }

      // Card
      var cardTokensSkyflowTonder = null;
      try {
        const collectResponseSkyflowTonder = await collectContainerTonder.collect();
        cardTokensSkyflowTonder = await collectResponseSkyflowTonder[ "records" ][0]["fields"];
      } catch (error) {
        console.log('error: ', error)
        var msgErrorDiv = document.getElementById("msgError");
        msgErrorDiv.classList.add("error-tonder-container-tonder");
        msgErrorDiv.innerHTML = "Por favor, verifica todos los campos de tu tarjeta";
        setTimeout(function () {
          document.querySelector("#tonderPayButton").disabled = false;
          msgErrorDiv.classList.remove("error-tonder-container-tonder");
          msgErrorDiv.innerHTML = "";
        }, 3000);
        return false;
      }

      var checkboxTonder = document.getElementById("acceptTonder");
      console.log(checkboxTonder);
      if (!checkboxTonder.checked) {
        var msgErrorDiv = document.getElementById("msgError");
        msgErrorDiv.classList.add("error-tonder-container-tonder");
        msgErrorDiv.innerHTML =
          "Necesitas aceptar los términos y condiciones";
        setTimeout(function () {
          document.querySelector("#tonderPayButton").disabled = false;
          msgErrorDiv.classList.remove("error-tonder-container-tonder");
          msgErrorDiv.innerHTML = "";
        }, 3000);
        return false;
      }

      try {
        // Openpay
        let deviceSessionIdTonder;
        if (openpayMerchantIdTonder && openpayPublicKeyTonder) {
          deviceSessionIdTonder = await openpayCheckoutTonder(
            openpayMerchantIdTonder,
            openpayPublicKeyTonder
          );
        }

        // Check user
        const jsonResponseUser = await getCustomer(billingEmail);
        userKeyTonder = jsonResponseUser.auth_token;

        const total = this.total;

        // Create order
        var orderItems = {
          business: apiKeyTonder,
          client: userKeyTonder,
          billing_address_id: null,
          shipping_address_id: null,
          amount: total,
          status: "A",
          reference: referenceTonder,
          is_oneclick: true,
          items: cartItemsTonder,
        };
        const jsonResponseOrder = await createOrderTonder(
          baseUrlTonder,
          apiKeyTonder,
          orderItems
        );

        // Create payment
        const now = new Date();
        const dateString = now.toISOString();
        var paymentItems = {
          business_pk: businessPkTonder,
          amount: total,
          date: dateString,
          order: jsonResponseOrder.id,
        };
        const jsonResponsePayment = await createPaymentTonder(
          baseUrlTonder,
          apiKeyTonder,
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
          business_id: businessPkTonder,
          payment_id: jsonResponsePayment.pk,
          source: 'sdk',
        };
        const jsonResponseRouter = await createCheckoutRouterTonder(
          baseUrlTonder,
          apiKeyTonder,
          routerItems
        );

        if (jsonResponseRouter) {
          document.querySelector("#tonderPayButton").disabled = false;
          return jsonResponseRouter;
        } else {
          var msgErrorDiv = document.getElementById("msgError");
          msgErrorDiv.classList.add("error-tonder-container-tonder");
          msgErrorDiv.innerHTML = "No se ha podido procesar el pago";
          setTimeout(function () {
            document.querySelector("#tonderPayButton").disabled = false;
            msgErrorDiv.classList.remove("error-tonder-container-tonder");
            msgErrorDiv.innerHTML = "";
          }, 3000);
          return false;
        }
      } catch (error) {
        console.log(error);
        var msgErrorDiv = document.getElementById("msgError");
        msgErrorDiv.classList.add("error-tonder-container-tonder");
        msgErrorDiv.innerHTML = "Ha ocurrido un error";
        setTimeout(function () {
          document.querySelector("#tonderPayButton").disabled = false;
          msgErrorDiv.classList.remove("error-tonder-container-tonder");
          msgErrorDiv.innerHTML = "";
        }, 3000);
        return false;
      }
    };

    // Inline checkout code
    const payButton = document.querySelector("#tonderPayButton");
    payButton.addEventListener("click", async function (event) {
      event.preventDefault();
      const prevButtonContent = payButton.innerHTML;
      payButton.innerHTML = `<div class="lds-dual-ring"></div>`;
      // Start tokenization
      const response = await getResponseTonder();
      // Response
      console.log(response);
      payButton.innerHTML = prevButtonContent;
      if (response) {
        const process3ds = new ThreeDSHandler({payload: response})
        if (!process3ds.redirectTo3DS()) {
          // TODO: Find an alternative to this 
          // this.form.submit()
        }
      }
    });

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

    // -- Register user --
    async function getCustomer(email) {
      return await customerRegister(baseUrlTonder, apiKeyTonder, email);
    }
  }
}