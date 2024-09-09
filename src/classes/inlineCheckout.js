import { apmItemsTemplate, cardItemsTemplate, cardTemplate } from '../helpers/template.js'
import {
  clearSpace,
  injectMercadoPagoSecurity,
  mapCards,
  showError,
  showMessage
} from '../helpers/utils';
import { initSkyflow } from '../helpers/skyflow'
import { globalLoader } from './globalLoader.js';
import { BaseInlineCheckout } from "./BaseInlineCheckout";
import {
  fetchCustomerCards,
  removeCustomerCard,
  saveCustomerCard,
  fetchCustomerAPMs
} from "../data";
import { MESSAGES } from "../shared/constants/messages";

export class InlineCheckout extends BaseInlineCheckout {
  static injected = false;
  static cardsInjected = false
  static apmsInjected = false
  static apmsData = [];
  deletingCards = [];
  customer = {}
  items = []
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
    msgNotification: "msgNotification",
    apmsListContainer: "apmsListContainer"
  }
  customization = {
    saveCards: {
      showSaveCardOption: false,
      showSaved: false,
      autoSave: false
    }
  }
  constructor({
    mode = "stage",
    apiKey,
    returnUrl,
    renderPaymentButton = false,
    callBack = () => { },
    styles,
    customization,
  }) {
    super({ mode, apiKey, returnUrl, callBack });
    this.renderPaymentButton = renderPaymentButton;
    this.customStyles = styles
    this.abortRefreshCardsController = new AbortController();
    // TODO: Wait until SaveCards is ready (server token).
    // this.customization = {
    //   ...this.customization,
    //   ...(customization || {}),
    //   saveCards: {
    //     ...this.customization.saveCards,
    //     ...(customization?.saveCards || {}),
    //   },
    // } 
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

  _setCartTotal(total) {
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

  /**
   * Injects the checkout into the DOM and initializes it.
   * Checks for an existing container and sets up an observer if needed.
   * @returns {void}
   * @public
   */
  async injectCheckout() {
    if (InlineCheckout.injected) return
    const containerTonderCheckout = document.querySelector("#tonder-checkout");
    if (containerTonderCheckout) {
      await this.#mount(containerTonderCheckout)
      return;
    }
    const observer = new MutationObserver(async (mutations, obs) => {
      const containerTonderCheckout = document.querySelector("#tonder-checkout");
      if (containerTonderCheckout) {
        await this.#mount(containerTonderCheckout)
        obs.disconnect();
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributeFilter: ['id']
    });
  }

  async #mount(containerTonderCheckout) {
    containerTonderCheckout.innerHTML = cardTemplate({ renderPaymentButton: this.renderPaymentButton, customStyles: this.customStyles, customization: this.customization });
    globalLoader.show()
    await this.#mountTonder();
    InlineCheckout.injected = true;
  }

  async #mountAPMs() {
    try {
      const apms = await fetchCustomerAPMs(this.baseUrl, this.apiKeyTonder);
      if (apms && apms['results'] && apms['results'].length > 0) {
        this.apmsData = apms['results']
        this.#loadAPMList(apms['results'])
      }
    } catch (e) {
      console.warn("Error getting APMS")
    }
  }

  async #mountTonder(getCards = true) {
    this.#mountPayButton()
    await this._initializeCheckout()
    try {
      const {
        vault_id,
        vault_url
      } = this.merchantData;
      if (this.email && getCards) {
        const customerResponse = await this._getCustomer({ email: this.email });
        if ("auth_token" in customerResponse) {
          const { auth_token } = customerResponse
          await this.#loadCardsList(auth_token)
        }
      }

      await this.#mountAPMs();

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

  /**
   * Removes the checkout from the DOM and cleans up associated resources.
   *
   * This method performs the following actions:
   * 1. Resets the injection status flags for the checkout, cards, and APMs.
   * 2. Aborts any ongoing requests using the AbortController.
   * 3. Creates a new AbortController for future use.
   * 4. Clears any existing injection intervals.
   *
   * Note: This method should be called when you want to completely remove
   * the checkout from the page and reset its state.
   *
   * @returns {void}
   * @public
   */
  removeCheckout() {
    InlineCheckout.injected = false
    InlineCheckout.cardsInjected = false
    InlineCheckout.apmsInjected = false
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

  async _checkout() {
    try {
      document.querySelector("#tonderPayButton").disabled = true;
    } catch (error) {
    }
    const { business } = this.merchantData
    let cardTokens;

    if (this.radioChecked === "new" || this.radioChecked === undefined) {
      cardTokens = await this.#getCardTokens();
    } else {
      cardTokens = {
        skyflow_id: this.radioChecked
      }
    }
    try {
      const customerData = await this._getCustomer(
        this.customer,
        this.abortController.signal
      )
      const { auth_token } = customerData;
      if (auth_token && this.email) {
        await this.#handleSaveCard(auth_token, business.pk, cardTokens)
      }

      const selected_apm = this.apmsData ? this.apmsData.find((iapm) => iapm.pk === this.radioChecked) : {};

      const jsonResponseRouter = await this._handleCheckout({
        ...(selected_apm && Object.keys(selected_apm).length > 0
          ? { payment_method: selected_apm.payment_method }
          : { card: cardTokens }),
        customer: customerData
      });

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

  async #handleSaveCard(auth_token, businessId, cardTokens) {
    const saveCard = document.getElementById("save-checkout-card");
    if ((saveCard && "checked" in saveCard && saveCard.checked) || !!this.customization.saveCards?.autoSave) {
      try {
        await saveCustomerCard(this.baseUrl, auth_token, businessId, {
          skyflow_id: cardTokens.skyflow_id,
        });
        showMessage(MESSAGES.cardSaved, this.collectorIds.msgNotification);
      } catch (error) {
        if (error?.message) {
          showError(error.message)
        }
      }

      await this.#loadCardsList(auth_token)
    }
  }
  async #loadCardsList(token) {
    if(this.cardsInjected || !this.customization.saveCards?.showSaved) return;
    this.cardsInjected = false
    const cardsResponse = await fetchCustomerCards(
        this.baseUrl,
        token,
        this.merchantData.business.pk,
    );
    let cards = []
    if("cards" in cardsResponse) {
      cards = cardsResponse.cards.map(mapCards)
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
  }

  #loadAPMList(apms) {
    if (this.apmsInjected) return;
    const injectInterval = setInterval(() => {
      const queryElement = document.querySelector(`#${this.collectorIds.apmsListContainer}`);
      if (queryElement && InlineCheckout.injected) {
        const filteredAndSortedApms = apms
          .filter((apm) =>
            clearSpace(apm.category.toLowerCase()) !== 'cards' && apm.status.toLowerCase() === 'active')
          .sort((a, b) => a.priority - b.priority);

        queryElement.innerHTML = apmItemsTemplate(filteredAndSortedApms);
        clearInterval(injectInterval);
        this.#mountRadioButtons();
        this.apmsInjected = true;
      }
    }, 500);
  }

  #mountRadioButtons(token = '') {
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
        event.stopImmediatePropagation();
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
        const businessId = this.merchantData.business.pk
        await removeCustomerCard(this.baseUrl, customerToken, skyflow_id, businessId)
      } catch (error) { } finally {
        this.deletingCards = this.deletingCards.filter(id => id !== skyflow_id);
        this.#refreshCardOnDelete(customerToken)
      }
    }
  }
  async #refreshCardOnDelete(customerToken) {
    if (this.deletingCards.length > 0) return;
    await this.#loadCardsList(customerToken)
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
