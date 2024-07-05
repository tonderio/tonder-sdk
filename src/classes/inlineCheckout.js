import { cardItemsTemplate, cardTemplate } from '../helpers/template.js'
import {
  getBusiness,
  customerRegister,
  createOrder,
  createPayment,
  startCheckoutRouter,
  getOpenpayDeviceSessionID,
  getCustomerCards,
  registerCard,
  deleteCustomerCard
} from '../data/api';
import {
  showError,
  getBrowserInfo,
  mapCards,
  showMessage,
} from '../helpers/utils';
import { initSkyflow } from '../helpers/skyflow'
import { ThreeDSHandler } from './3dsHandler.js';
import { globalLoader } from './globalLoader.js';


export class InlineCheckout {
  static injected = false;
  static cardsInjected = false
  deletingCards = [];
  customer = {}
  items = []
  baseUrl = null
  collectContainer = null
  merchantData = {}
  cartTotal = null
  metadata = {}
  card = {}
  collectorIds = {
    cardsListContainer: "cardsListContainer",
    holderName: "collectCardholderName",
    cardNumber: "collectCardNumber",
    expirationMonth: "collectExpirationMonth",
    expirationYear: "collectExpirationYear",
    cvv: "collectCvv",
    tonderPayButton: "tonderPayButton",
    msgError: "msgError",
    msgNotification: "msgNotification"
  }

  constructor({
    mode = "stage",
    apiKey,
    returnUrl,
    successUrl,
    renderPaymentButton = false,
    callBack = () => { },
    styles
  }) {
    this.apiKeyTonder = apiKey;
    this.returnUrl = returnUrl;
    this.successUrl = successUrl;
    this.renderPaymentButton = renderPaymentButton;
    this.callBack = callBack;
    this.customStyles = styles
    this.mode = mode
    this.baseUrl = this.#getBaseUrl()

    this.abortController = new AbortController()
    this.abortRefreshCardsController = new AbortController()
    this.process3ds = new ThreeDSHandler(
      { apiKey: apiKey, baseUrl: this.baseUrl, successUrl: successUrl }
    )
  }

  #getBaseUrl() {
    const modeUrls = {
      'production': 'https://app.tonder.io',
      'sandbox': 'https://sandbox.tonder.io',
      'stage': 'https://stage.tonder.io',
      'development': 'http://localhost:8000',
    };

    return modeUrls[this.mode] || modeUrls['stage']
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

  async handle3dsRedirect(response) {
    const iframe = response?.next_action?.iframe_resources?.iframe

    if (iframe) {
      this.process3ds.loadIframe().then(() => {
        //TODO: Check if this will be necessary on the frontend side
        // after some the tests in production, since the 3DS process
        // doesn't works properly on the sandbox environment
        // setTimeout(() => {
        //   process3ds.verifyTransactionStatus();
        // }, 10000);
        this.process3ds.verifyTransactionStatus();
      }).catch((error) => {
        console.log('Error loading iframe:', error)
      })
    } else {
      const redirectUrl = this.process3ds.getRedirectUrl()
      if (redirectUrl) {
        this.process3ds.redirectToChallenge()
      } else {
        return response;
      }
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
        this.#handleCard(data)
        const response = await this.#checkout()
        this.process3ds.setPayload(response)
        this.callBack(response);
        const payload = await this.handle3dsRedirect(response)
        if (payload) {
          resolve(response);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  #handleCustomer(customer) {
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
    this.customer = customer
  }

  #handleMetadata(data) {
    this.metadata = data?.metadata
  }

  #handleCurrency(data) {
    this.currency = data?.currency
  }

  #handleCard(data) {
    this.card = data?.card
  }

  setCartItems(items) {
    this.cartItems = items
  }

  configureCheckout(data) {
    if ('customer' in data)
      this.#handleCustomer(data['customer'])
  }
  
  setCartTotal(total) {
    this.cartTotal = total
    this.#updatePayButton()
  }

  #updatePayButton() {
    const payButton = document.querySelector("#tonderPayButton");
    if (!payButton) return
    payButton.textContent = `Pagar $${this.cartTotal}`;
  }

  setCallback(cb) {
    this.cb = cb
  }

  injectCheckout() {
    if (InlineCheckout.injected) return
    const containerTonderCheckout = document.querySelector("#tonder-checkout");
    if (containerTonderCheckout) {
      this.#mount(containerTonderCheckout)
      return;
    }
    const observer = new MutationObserver((mutations, obs) => {
      const containerTonderCheckout = document.querySelector("#tonder-checkout");
      if (containerTonderCheckout) {
        this.#mount(containerTonderCheckout)
        obs.disconnect();
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributeFilter: ['id']
    });
  }

  async verify3dsTransaction () {
    const result3ds = await this.process3ds.verifyTransactionStatus()
    const resultCheckout = await this.resumeCheckout(result3ds)
    this.process3ds.setPayload(resultCheckout)
    if (resultCheckout?.is_route_finished && resultCheckout?.provider === 'tonder') {
      return resultCheckout
    }
    return this.handle3dsRedirect(resultCheckout)
  }

  async resumeCheckout(response) {
    if (["Failed", "Declined", "Cancelled"].includes(response?.status)) {
      globalLoader.show()
      const routerItems = {
        checkout_id: response.checkout?.id,
      };
      try {
        const routerResponse = await startCheckoutRouter(
          this.baseUrl,
          this.apiKeyTonder,
          routerItems
        );
        return routerResponse
      } catch (error) {
        throw error
      } finally {
        globalLoader.remove()
      }
    }
    return response
  }

  #mount(containerTonderCheckout) {
    containerTonderCheckout.innerHTML = cardTemplate;
    globalLoader.show()
    this.#mountTonder();
    InlineCheckout.injected = true;
  }

  async #fetchMerchantData() {
    this.merchantData = await getBusiness(
      this.baseUrl,
      this.apiKeyTonder,
      this.abortController.signal
    );
    return this.merchantData
  }

  async getCustomer(customer, signal) {
    return await customerRegister(this.baseUrl, this.apiKeyTonder, customer, signal);
  }

  async #mountTonder(getCards = false) {
    this.#mountPayButton()
    try {
      const {
        vault_id,
        vault_url,
      } = await this.#fetchMerchantData();
      console.log("this.email : ", this.email )
      if (this.email && getCards) {
        const customerResponse = await this.getCustomer({ email: this.email });
        if ("auth_token" in customerResponse) {
          const { auth_token } = customerResponse
          const cards = await getCustomerCards(this.baseUrl, auth_token);

          if ("cards" in cards) {
            const cardsMapped = cards.cards.map(mapCards)
            this.#loadCardsList(cardsMapped, auth_token)
          }
        }
      }

      this.collectContainer = await initSkyflow(
        vault_id,
        vault_url,
        this.baseUrl,
        this.apiKeyTonder,
        this.abortController.signal,
        this.customStyles,
        this.collectorIds
      );
      setTimeout(() => {
        globalLoader.remove()
      }, 800)
    } catch (e) {
      if (e && e.name !== 'AbortError') {
        globalLoader.remove()
        showError("No se pudieron cargar los datos del comercio.")
      }
    }
  }

  removeCheckout() {
    InlineCheckout.injected = false
    InlineCheckout.cardsInjected = false
    // Cancel all requests
    this.abortController.abort();
    this.abortController = new AbortController();

    clearInterval(this.injectInterval);
    console.log("InlineCheckout removed from DOM and cleaned up.");
  }

  async #getCardTokens() {
    if (this.card?.skyflow_id) return this.card
    try {
      const collectResponse = await this.collectContainer.container.collect();
      const cardTokens = await collectResponse["records"][0]["fields"];
      return cardTokens;
    } catch (error) {
      showError("Por favor, verifica todos los campos de tu tarjeta")
      throw error;
    }
  }

  async #checkout() {
    try {
      document.querySelector("#tonderPayButton").disabled = true;
    } catch (error) {
    }

    const { openpay_keys, reference, business } = this.merchantData
    const total = Number(this.cartTotal)

    let cardTokens = null;
    if (this.radioChecked === "new" || this.radioChecked === undefined) {
      cardTokens = await this.#getCardTokens();
    } else {
      cardTokens = {
        skyflow_id: this.radioChecked
      }
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

      const { id, auth_token } = await this.getCustomer(
        this.customer,
        this.abortController.signal
      )
      if (auth_token && this.email) {
        const saveCard = document.getElementById("save-checkout-card");
        if (saveCard && "checked" in saveCard && saveCard.checked) {
          await registerCard(this.baseUrl, auth_token, { skyflow_id: cardTokens.skyflow_id });

          this.cardsInjected = false;

          const cards = await getCustomerCards(this.baseUrl, auth_token);
          if ("cards" in cards) {
            const cardsMapped = cards.cards.map((card) => mapCards(card))
            this.#loadCardsList(cardsMapped, auth_token)
          }

          showMessage("Tarjeta registrada con éxito", this.collectorIds.msgNotification);

        }
      }
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
        client_id: id,
        amount: total,
        date: dateString,
        order_id: jsonResponseOrder.id,
      };
      const jsonResponsePayment = await createPayment(
        this.baseUrl,
        this.apiKeyTonder,
        paymentItems
      );

      // Checkout router
      const routerItems = {
        card: cardTokens,
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
        } catch { }
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

  #loadCardsList(cards, token) {
    if (this.cardsInjected) return;
    const injectInterval = setInterval(() => {
      const queryElement = document.querySelector(`#${this.collectorIds.cardsListContainer}`);
      if (queryElement && InlineCheckout.injected) {
        queryElement.innerHTML = cardItemsTemplate(cards)
        clearInterval(injectInterval)
        this.#mountRadioButtons(token)
        this.cardsInjected = true
      }
    }, 500);
  }

  #mountRadioButtons(token) {
    const radioButtons = document.getElementsByName(`card_selected`);
    for (const radio of radioButtons) {
      radio.style.display = "block";
      radio.onclick = async (event) => {
        await this.#handleRadioButtonClick(radio);
      };
    }
    const cardsButtons = document.getElementsByClassName("card-delete-button");
    for (const cardButton of cardsButtons) {
      cardButton.addEventListener("click", (event) => {
        event.preventDefault();
        this.#handleDeleteCardButtonClick(token, cardButton)
      }, false);
    }
  }

  async #handleRadioButtonClick(radio) {
    if (radio.id === this.radioChecked || (radio.id === "new" && this.radioChecked === undefined)) return;
    const containerForm = document.querySelector(".container-form");
    if (containerForm) {
      containerForm.style.display = radio.id === "new" ? "block" : "none";
    }
    if (radio.id === "new") {
      if (this.radioChecked !== radio.id) {
        globalLoader.show()
        this.#mountTonder(false);
        InlineCheckout.injected = true;
      }
    } else {
      this.#unmountForm();
    }
    this.radioChecked = radio.id;
  }

  async #handleDeleteCardButtonClick(customerToken, button) {
    const id = button.attributes.getNamedItem("id")
    const skyflow_id = id?.value?.split("_")?.[2]
    if (skyflow_id) {
      const cardClicked = document.querySelector(`#card_container-${skyflow_id}`);
      if (cardClicked) {
        cardClicked.style.display = "none"
      }
      try {
        this.deletingCards.push(skyflow_id);
        if (this.abortRefreshCardsController) {
          this.abortRefreshCardsController.abort();
          this.abortRefreshCardsController = new AbortController();
        }
        await deleteCustomerCard(this.baseUrl, customerToken, skyflow_id)
      } catch {
      } finally {
        this.deletingCards = this.deletingCards.filter(id => id !== skyflow_id);
        this.#refreshCardOnDelete(customerToken)
      }
    }
  }
  async #refreshCardOnDelete(customerToken) {
    if (this.deletingCards.length > 0) return;
    this.cardsInjected = false
    const cards = await getCustomerCards(this.baseUrl, customerToken, "", this.abortRefreshCardsController.signal)
    if ("cards" in cards) {
      const cardsMapped = cards.cards.map(mapCards)
      this.#loadCardsList(cardsMapped, customerToken)
    }
  }
  #unmountForm() {
    InlineCheckout.injected = false
    if (this.collectContainer) {
      if ("unmount" in this.collectContainer.elements.cardHolderNameElement) this.collectContainer.elements.cardHolderNameElement.unmount()
      if ("unmount" in this.collectContainer.elements.cardNumberElement) this.collectContainer.elements.cardNumberElement.unmount()
      if ("unmount" in this.collectContainer.elements.expiryYearElement) this.collectContainer.elements.expiryYearElement.unmount()
      if ("unmount" in this.collectContainer.elements.expiryMonthElement) this.collectContainer.elements.expiryMonthElement.unmount()
      if ("unmount" in this.collectContainer.elements.cvvElement) this.collectContainer.elements.cvvElement.unmount()
    }
  }
}
