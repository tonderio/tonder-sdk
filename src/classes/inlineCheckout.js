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
      showSaveCardOption: true,
      showSaved: true,
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
    this.customization = {
      ...this.customization,
      ...(customization || {}),
      saveCards: {
        ...this.customization.saveCards,
        ...(customization?.saveCards || {}),
      },
    }
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
      console.log("ERROR router:",  error.details);
      console.log("MIT", error.details.psp_response[0].res)
      // TODO: ONLY FOR MIT TEST

      // Crear el formulario dinámicamente
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://qa3.mitec.com.mx/ws3dsecure/Auth3dsecure";
    
      // Crear el input hidden con los datos XML
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "xml";
      // const mit_data = "2nN5ZInOKur5M1yDYEJqycAw+R3yyvykVeHTik/qAi/k2+PNqXK/TEqaE/PVdCr3XgjRmTocLVTyXDpLAX3r52ut+HBOcUuZuJZrGvzSCPXHRR32vPaFUPnqQgUAMAnHnlmBjmlAYLAiNSww1hoCLHzSWeOsQzPqTK3uFftcRIBxmQEq4hHm4Pjr1KoLZJoIWaGAwM0LSYZHBfeQQAIG3X2A5hM9940VECp18g1GOZ6Y3bolJnb4Lao8YxjKtd4CWjj/ir+a4U3FSFe13ZAtZI2kQXnb2c+O2+sHhpIKsif0Kgvf3Ki9YFyvKyXsCxyGqd2895v96DzD4d4/fJfeQIVcbjGzES1ePspw7Do2xiXVNz91xLSoTLqeEAMMZLH/C69fPygRC1VBWqtdLLfWSQXO6mMuJu1ktwVREKCIL8pzRnx5ayS7tNtXDf1KvDEjKHy6C6oiWnEZg0h4VniY6vZAm4wiftj1SbqnUab8+9Uw0Ihe638rOLTErkCdtLTkEpmFL3MfaObjyXQ5zLr1ds1Zk7yP5XE5jLegyiIoQS4zxnnmj+tdxI5Qv5PMzu4tMF1A+WY4iPsJFNDF6i0R4ROOTdQdtDCxUGInuP4IolhYwJYZI4xVnxs80EIdERSM7Sgw0wcs9Vl1mKP2AJ7j3aHQ1YiBosMJjZOZhov9naYDuIotBX80NkTkUnLLy20atqe2OxOqRZPRDZQ1+WM80slNJqKAoI8VkPyTeNc50Nd0Q1SzWH0Z4K9o1ccb9QvqJxrb9o+DRiIXVU4o4fOrykpg41rfS+9S/rKDmh8OLSEVJgaU8+BUCgaCSfMa8zc0K5OhPS411HVJR+6teTZB9DFrTjeNX9CqjZCdl6S7DaBEX4i/qz0ukOCIQfCapvkxQZ0Z0ousjDbBo7GPDe2YAX4rc3NxzmbahVkOHFDf8qNDDsdu8r8elQqe4tANUhOfoe87DiC3Tx7Y8mHrs/MTJal+URW34u7mRsZpsUBhszdfXF3XOBwLL4v1O5YFL1TLsZGWK0GbcCNGMWUz9R2VkE3pK7TbwMf2xMDtSXhtIlFu2p6vn5Tbo2VYJxG8o4By6gF+RUCJ+n/ZJfhPRdBeslz3Ax7h7OhJH8ZnasUIv9Df2Gt2WumSNF1DrJ+/rgsa5n9XUvDLwuxerspM6nlxKGYzFZ/m41/Hk9ftQHg5gN25ts3q3fCgfLBLGATqgZ3Firc3xO8ZPklviaMevb2P1zaDQ9QBPsoFrTuncpegIvoD1EQIYSukj32egu8qdWg0"
      input.value = error.details.psp_response[0].res;
    
      form.appendChild(input);
    
      document.body.appendChild(form);

      // enviar peticion
      form.submit();

      // // *** WITH IFRAME
      // const iframe = document.getElementById("iframe-mit");
    
      // const formHtml = `
      //   <form id="mitForm" method="POST" action="https://qa3.mitec.com.mx/ws3dsecure/Auth3dsecure">
      //     <input type="hidden" name="xml" value="${error.details.psp_response[0].res}">
      //     <input type="submit" value="Submit">
      //   </form>
      //   <script>
      //     document.getElementById('mitForm').submit();
      //   </script>
      // `;

      // const doc = iframe.contentWindow.document;
      // doc.open();
      // doc.write(formHtml);
      // doc.close();

      // // TODO: FIN MIT TEST

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
