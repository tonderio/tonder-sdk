import {
  apmItemsTemplate,
  cardItemsTemplate,
  cardTemplate,
  containerCheckoutTemplate,
} from "../helpers/template.js";
import { clearSpace, executeCallback, mapCards, showError, showMessage } from "../helpers/utils";
import { initSkyflow, initUpdateSkyflow } from "../helpers/skyflow";
import { globalLoader } from "./globalLoader.js";
import { BaseInlineCheckout } from "./BaseInlineCheckout";
import {
  fetchCustomerAPMs,
  fetchCustomerCards,
  removeCustomerCard,
  saveCustomerCard,
} from "../data";
import { MESSAGES } from "../shared/constants/messages";
import Accordion from "accordion-js";
import get from "lodash.get";
import { HTML_IDS } from "../shared/constants/htmlTonderIds";
import { DISPLAY_MODE } from "../shared/constants/displayMode";

export class InlineCheckout extends BaseInlineCheckout {
  static injected = false;
  static cardsInjected = false;
  static apmsInjected = false;
  #cardsData = [];
  #paymentMethodsData = [];
  #customerData = {};
  accordionCards = null;
  accordionPaymentMethods = null;

  deletingCards = [];
  customer = {};
  items = [];
  collectContainer = null;
  updateCollectContainer = null;
  merchantData = {};
  cartTotal = null;
  metadata = {};
  card = {};
  collectorIds = {
    cardsListContainer: HTML_IDS.cardsListContainer,
    holderName: HTML_IDS.collectCardholderName,
    cardNumber: HTML_IDS.collectCardNumber,
    expirationMonth: HTML_IDS.collectExpirationMonth,
    expirationYear: HTML_IDS.collectExpirationYear,
    cvv: HTML_IDS.collectCvv,
    tonderPayButton: HTML_IDS.tonderPayButton,
    tonderCancelButton: HTML_IDS.tonderCancelButton,
    msgError: HTML_IDS.msgError,
    msgNotification: HTML_IDS.msgNotification,
    msgErrorText: HTML_IDS.msgErrorText,
    msgNotificationText: HTML_IDS.msgNotificationText,
    apmsListContainer: HTML_IDS.apmsListContainer,
  };
  customization = {
    displayMode: DISPLAY_MODE.light,
    saveCards: {
      showSaveCardOption: false,
      showSaved: false,
      autoSave: false,
    },
    paymentButton: {
      show: false,
      text: "Pagar",
      showAmount: true,
    },
    cancelButton: {
      show: false,
      text: "Cancelar",
    },
    paymentMethods: {
      show: true,
    },
    cardForm: {
      show: true,
    },
    showMessages: true,
  };
  callbacks = {
    onCancel: () => {},
  };
  constructor({
    mode = "stage",
    apiKey,
    returnUrl,
    callBack = () => {},
    styles,
    customization,
    callbacks,
    signatures,
  }) {
    super({ mode, apiKey, returnUrl, callBack, signatures });
    this.customStyles = styles;
    this.callbacks = { ...this.callbacks, ...(callbacks ? { ...callbacks } : {}) };
    this.abortRefreshCardsController = new AbortController();
    // TODO: Wait until SaveCards is ready (server token).
    this.customization = {
      ...this.customization,
      ...(customization || {}),
      saveCards: {
        ...this.customization.saveCards,
        ...(customization?.saveCards || {}),
      },
      paymentButton: {
        ...this.customization.paymentButton,
        ...(customization?.paymentButton || {}),
      },
      paymentMethods: {
        ...this.customization.paymentMethods,
        ...(customization?.paymentMethods || {}),
      },
      cardForm: {
        ...this.customization.cardForm,
        ...(customization?.cardForm || {}),
      },
    };
  }

  /**
   * Injects the checkout into the DOM and initializes it.
   * Checks for an existing container and sets up an observer if needed.
   * @returns {void}
   * @public
   */
  async injectCheckout() {
    if (InlineCheckout.injected) return;
    const containerTonderCheckout = document.querySelector(`#${HTML_IDS.tonderCheckout}`);
    if (containerTonderCheckout) {
      await this.#mount(containerTonderCheckout);
      return;
    }
    const observer = new MutationObserver(async (mutations, obs) => {
      const containerTonderCheckout = document.querySelector(`#${HTML_IDS.tonderCheckout}`);
      if (containerTonderCheckout) {
        await this.#mount(containerTonderCheckout);
        obs.disconnect();
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributeFilter: ["id"],
    });
  }

  setCallback(cb) {
    this.cb = cb;
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
    InlineCheckout.injected = false;
    InlineCheckout.cardsInjected = false;
    InlineCheckout.apmsInjected = false;
    // Cancel all requests
    this.abortController.abort();
    this.abortController = new AbortController();

    clearInterval(this.injectInterval);
    console.log("InlineCheckout removed from DOM and cleaned up.");
  }

  async #mount(containerTonderCheckout) {
    containerTonderCheckout.innerHTML = containerCheckoutTemplate({
      customStyles: this.customStyles,
      customization: this.customization,
    });
    globalLoader.show();
    await this._initializeCheckout();
    await this.#loadInitialData();
    const currentContent = document.querySelector(`#${HTML_IDS.tonderContainer}`);
    currentContent.innerHTML = `
      ${currentContent.innerHTML}
      ${cardTemplate({
        customStyles: this.customStyles,
        customization: this.customization,
        cardsData: this.#cardsData,
        paymentMethodsData: this.#paymentMethodsData,
        collectorIds: this.collectorIds,
      })}
    `;
    await this.#mountTonder();
    InlineCheckout.injected = true;
  }

  async #mountTonder() {
    try {
      const { vault_id, vault_url } = this.merchantData;

      if (this.email && this.#cardsData.length > 0) {
        await this.#loadCardsList();
      }
      this.#mountButtons();
      await this.#loadAPMList();

      this.collectContainer = await initSkyflow(
        vault_id,
        vault_url,
        this.baseUrl,
        this.apiKeyTonder,
        this.abortController.signal,
        this.customStyles,
        this.collectorIds,
        this.customization.displayMode,
      );

      setTimeout(() => {
        globalLoader.remove();
      }, 800);
    } catch (e) {
      if (e && e.name !== "AbortError") {
        globalLoader.remove();
        showError("No se pudieron cargar los datos del comercio.", this.radioChecked);
      }
    }
  }

  #mountButtons(cardId = "") {
    if (this.customization.paymentButton.show) {
      this.#mountButton(this.collectorIds.tonderPayButton, cardId, this.#handlePaymentClick);
    }
    if (this.customization.cancelButton.show) {
      this.#mountButton(this.collectorIds.tonderCancelButton, cardId, async () => {
        await executeCallback({
          callbacks: this.callbacks,
          callback: "onCancel",
          throwError: true,
        });
      });
    }
    const containerID = `#acContainer${cardId}`;
    const container = document.querySelector(containerID);
    document.querySelectorAll(".ac-option-panel-container").forEach(cont => {
      cont.classList.remove("show");
    });

    if (container) {
      container.classList.add("show");
    }
  }

  #mountButton(buttonId = "", cardId = "", fn = () => {}) {
    if (!this.customization.paymentButton.show) return;

    const btnID = `#${buttonId}${cardId}`;
    const findButton = document.querySelector(btnID);

    if (!findButton) {
      console.error(`${buttonId} not found`);
      return;
    }

    this.#updateButton({
      style: { display: "block" },
      buttonId,
      ...(cardId ? { cardId } : {}),
    });

    findButton.onclick = async event => {
      event.preventDefault();
      await fn();
    };
  }

  #handlePaymentClick = async () => {
    try {
      const response = await this.payment();
      this.callBack(response);
    } catch (error) {
      this.callBack({ error: error });
    }
  };

  _setCartTotal(total) {
    this.cartTotal = total;
    this.#updateButton();
  }

  #updateButton(data) {
    try {
      const buttonDataId = data?.buttonId || this.collectorIds.tonderPayButton;
      const btnID =
        data?.cardId && data?.cardId !== "new"
          ? `#${buttonDataId}${data.cardId}`
          : `#${buttonDataId}`;
      const textButton =
        buttonDataId === this.collectorIds.tonderPayButton
          ? `<div class="pay-button-text">${this.customization.paymentButton.text}${this.customization.paymentButton.showAmount ? ` $${this.cartTotal}` : ""}</div>`
          : `<div class="cancel-button-text">${this.customization.cancelButton.text}</div>`;

      const btnTextContent = data?.textContent || textButton;
      const disabledBtn = data?.disabled;
      const loadingHtml = data?.loading ? `<div class="spinner-tndr"></div>` : "";
      const btnStyle = data?.style || {};
      const payButton = document.querySelector(btnID);
      if (!payButton) return;
      if (loadingHtml !== "") {
        payButton.innerHTML = loadingHtml;
      } else {
        payButton.innerHTML = btnTextContent;
      }
      if (btnStyle) {
        Object.keys(btnStyle).forEach(btn => {
          payButton.style[btn] = btnStyle[btn];
        });
      }
      if (disabledBtn !== undefined && "disabled" in payButton) {
        payButton.disabled = disabledBtn;
      }
    } catch (e) {
      console.error("Pay button not found due to update", e);
    }
  }

  async #getCardTokens(cardSelected) {
    if (this.card?.skyflow_id) return this.card;
    try {
      const collectResponse =
        cardSelected && cardSelected !== "new"
          ? await this.updateCollectContainer.container.collect()
          : await this.collectContainer.container.collect();
      return await collectResponse["records"][0]["fields"];
    } catch (error) {
      showError("Por favor, verifica todos los campos de tu tarjeta", this.radioChecked);
      throw error;
    }
  }

  async _checkout() {
    this.#updateButton({
      cardId: this.radioChecked,
      loading: true,
      disabled: true,
    });
    try {
      const { business } = this.merchantData;
      let cardTokens;
      const selected_apm = this.#paymentMethodsData
        ? this.#paymentMethodsData.find(iapm => iapm.pk === this.radioChecked)
        : {};

      if (this.radioChecked === "new" || this.radioChecked === undefined) {
        cardTokens = await this.#getCardTokens(this.radioChecked);
      } else {
        if (!selected_apm) {
          await this.#getCardTokens(this.radioChecked);
        }
        cardTokens = {
          skyflow_id: this.radioChecked,
        };
      }

      this.#customerData = await this._getCustomer(this.customer, this.abortController.signal);
      if (this.email) {
        await this.#handleSaveCard(business.pk, cardTokens);
      }

      const jsonResponseRouter = await this._handleCheckout({
        ...(selected_apm && Object.keys(selected_apm).length > 0
          ? { payment_method: selected_apm.payment_method }
          : { card: cardTokens }),
        customer: this.#customerData,
      });

      if (jsonResponseRouter) {
        return jsonResponseRouter;
      } else {
        showError("No se ha podido procesar el pago", this.radioChecked);
        return false;
      }
    } catch (error) {
      console.log("Error payment", error);

      showError("Ha ocurrido un error", this.radioChecked);
      throw error;
    } finally {
      this.#updateButton({ cardId: this.radioChecked, disabled: false });
    }
  }

  async #handleSaveCard(businessId, cardTokens) {
    if (!this.#customerData.auth_token) return;
    const saveCard = document.getElementById("save-checkout-card");
    if (
      (saveCard && "checked" in saveCard && saveCard.checked) ||
      !!this.customization.saveCards?.autoSave
    ) {
      try {
        await saveCustomerCard(
          this.signatures,
          this.baseUrl,
          this.#customerData.auth_token,
          this.secureToken,
          businessId,
          {
            skyflow_id: cardTokens.skyflow_id,
          },
        );
        showMessage(MESSAGES.cardSaved, this.radioChecked);
      } catch (error) {
        if (error?.message) {
          showError(error.message, this.radioChecked);
        }
      }

      await this.#loadCardsList();
    }
  }

  async #loadCardsList() {
    try {
      if (this.cardsInjected || !this.customization.saveCards?.showSaved) return;
      this.cardsInjected = false;
      let cards = [];
      cards = this.#cardsData.map(mapCards);
      const injectInterval = setInterval(() => {
        const queryElement = document.querySelector(`#${this.collectorIds.cardsListContainer}`);
        if (queryElement && InlineCheckout.injected) {
          queryElement.innerHTML = cardItemsTemplate({
            cards: cards,
            customization: this.customization,
            collectorIds: this.collectorIds,
            customStyles: this.customStyles,
          });
          clearInterval(injectInterval);
          this.#generateAccordion();
          this.#mountRadioButtons();
          this.cardsInjected = true;
        }
      }, 500);
    } catch (error) {
      console.warn("Error mount Customer Cards", error);
    }
  }

  #loadAPMList() {
    try {
      if (this.apmsInjected || !this.customization.paymentMethods?.show) return;
      const injectInterval = setInterval(() => {
        const queryElement = document.querySelector(`#${this.collectorIds.apmsListContainer}`);
        if (queryElement && InlineCheckout.injected) {
          const filteredAndSortedApms = this.#paymentMethodsData
            .filter(
              apm =>
                clearSpace(apm.category.toLowerCase()) !== "cards" &&
                apm.status.toLowerCase() === "active",
            )
            .sort((a, b) => a.priority - b.priority);
          queryElement.innerHTML = apmItemsTemplate({
            paymentMethods: filteredAndSortedApms,
            customization: this.customization,
            collectorIds: this.collectorIds,
          });
          clearInterval(injectInterval);
          this.#generateAccordion("paymentMethods");
          this.#mountRadioButtons();
          this.apmsInjected = true;
        }
      }, 500);
    } catch (error) {
      console.warn("Error mount Payment Methods", error);
    }
  }

  async #loadInitialData() {
    try {
      const canGetCards = this.email && this.customization.saveCards?.showSaved;
      const pmResponsePromise = this.customization.paymentMethods?.show
        ? fetchCustomerAPMs(this.baseUrl, this.apiKeyTonder)
        : Promise.resolve(null);
      const customerDataPromise =
        canGetCards && !!this.customer
          ? this._getCustomer({ ...this.customer })
          : Promise.resolve(null);

      const [pmResponse, customerData] = await Promise.all([
        pmResponsePromise,
        customerDataPromise,
      ]);

      this.#paymentMethodsData = get(pmResponse, "results", []);
      this.#customerData = customerData;

      if (canGetCards && customerData && "auth_token" in customerData) {
        const { auth_token } = customerData;
        const cardsResponse = await fetchCustomerCards(
          this.signatures,
          this.baseUrl,
          auth_token,
          this.secureToken,
          this.merchantData.business.pk,
        );
        this.#cardsData = get(cardsResponse, "cards", []);
      }
    } catch (e) {
      console.warn("Error loading initial data", e);
    }
  }
  #mountRadioButtons() {
    const radioButtons = document.getElementsByName(`card_selected`);
    for (const radio of radioButtons) {
      radio.style.display = "block";
      radio.onclick = async event => {
        const position = Array.from(radioButtons).indexOf(radio);
        const classType = radio.classList[0];
        await this.#handleRadioButtonClick(radio, position, classType);
      };
    }
    const cardsButtons = document.getElementsByClassName("card-delete-button");
    for (const cardButton of cardsButtons) {
      cardButton.addEventListener(
        "click",
        event => {
          event.preventDefault();
          event.stopImmediatePropagation();
          this.#handleDeleteCardButtonClick(cardButton);
        },
        false,
      );
    }
  }

  async #handleRadioButtonClick(radio, position = null, type = "") {
    if (radio.id === this.radioChecked || (radio.id === "new" && this.radioChecked === undefined))
      return;
    const containerForm = document.querySelector(".container-form");
    if (containerForm) {
      containerForm.style.display = radio.id === "new" ? "block" : "none";
    }

    if (radio.id === "new") {
      this.#removeClass(["cvvContainer", "cvvContainerCard"]);
      this.#handleOpenCloseAccordion("", null, true);
      if (this.radioChecked !== radio.id) {
        globalLoader.show();
        await this.#mountTonder();
        InlineCheckout.injected = true;
      }
    } else {
      this.#handleOpenCloseAccordion(type, null, false, true);
      if (position !== null) {
        this.#handleOpenCloseAccordion(type, position, true);
      }
      this.#unmountForm();
    }
    this.radioChecked = radio.id;
  }

  async #handleDeleteCardButtonClick(button) {
    if (!this.#customerData.auth_token) return;

    const id = button.attributes.getNamedItem("id");
    const skyflow_id = id?.value?.split("_")?.[2];

    if (skyflow_id) {
      const cardClicked = document.querySelector(`#option_container-${skyflow_id}`);
      if (cardClicked) {
        cardClicked.style.display = "none";
      }
      try {
        this.deletingCards.push(skyflow_id);
        if (this.abortRefreshCardsController) {
          this.abortRefreshCardsController.abort();
          this.abortRefreshCardsController = new AbortController();
        }
        const businessId = this.merchantData.business.pk;
        await removeCustomerCard(
          this.signatures,
          this.baseUrl,
          this.#customerData.auth_token,
          this.secureToken,
          skyflow_id,
          businessId,
        );
      } catch (error) {
      } finally {
        this.deletingCards = this.deletingCards.filter(id => id !== skyflow_id);
        this.#refreshCardOnDelete();
      }
    }
  }

  async #refreshCardOnDelete() {
    if (this.deletingCards.length > 0) return;
    await this.#loadCardsList();
  }

  #generateAccordion(type = "cards") {
    const accordionByType = {
      cards: {
        accClass: "accordion-container",
        triggerClass: "card-item-label",
      },
      paymentMethods: {
        accClass: "accordion-container-apm",
        triggerClass: "apm-item-label",
      },
    };
    const accordion = new Accordion("." + accordionByType[type].accClass, {
      triggerClass: accordionByType[type].triggerClass,
      duration: 300,
      collapse: true,
      showMultiple: false,
      onOpen: async currentElement => {
        await this.#handleOpenCardAccordion(currentElement, type);
      },
    });

    if (type === "cards") {
      this.accordionCards = accordion;
    } else if (type === "paymentMethods") {
      this.accordionPaymentMethods = accordion;
    }
  }

  #removeClass(selectors = [], className = "show") {
    selectors.forEach(slcItem => {
      document.querySelectorAll("." + slcItem).forEach(container => {
        container.classList.remove(className);
      });
    });
  }

  async #handleOpenCardAccordion(currentElement, type = "cards") {
    const { vault_id, vault_url } = this.merchantData;
    const container_radio_id = currentElement.id.replace("option_container-", "");

    if (
      this.updateCollectContainer &&
      "unmount" in this.updateCollectContainer?.elements?.cvvElement
    ) {
      await this.updateCollectContainer.elements.cvvElement.unmount();
    }
    this.#removeClass(["cvvContainer", "cvvContainerCard"]);

    const radio_card = document.getElementById(container_radio_id);
    radio_card.checked = true;

    try {
      if (type === "cards") {
        this.updateCollectContainer = await initUpdateSkyflow(
          container_radio_id,
          vault_id,
          vault_url,
          this.baseUrl,
          this.apiKeyTonder,
          this.abortController.signal,
          this.customStyles,
          this.customization.displayMode,
        );
        setTimeout(() => {
          document.querySelector(`#cvvContainer${container_radio_id}`).classList.add("show");
        }, 5);
      }

      this.#mountButtons(container_radio_id);
    } catch (e) {
      console.error("Ha ocurrido un error", e);
    }
    await this.#handleRadioButtonClick(radio_card, null, type);
  }

  #handleOpenCloseAccordion(type = "", position = null, closeAll = false, closeOthers = false) {
    const accordions = [
      { type: "cards", accordion: this.accordionCards },
      { type: "paymentMethods", accordion: this.accordionPaymentMethods },
    ];
    accordions.forEach(({ accordion, type: currentType }) => {
      if (!accordion) return;

      if (closeAll && accordion.closeAll) {
        accordion.closeAll();
      }

      if (closeOthers && currentType !== type && accordion.closeAll) {
        accordion.closeAll();
      }

      if (position !== null && currentType === type && accordion.open) {
        accordion.open(
          currentType !== "paymentMethods" ? position : position - (this.#cardsData.length + 1),
        );
      }
    });
  }

  #unmountForm() {
    InlineCheckout.injected = false;
    if (this.collectContainer) {
      if ("unmount" in this.collectContainer.elements.cardHolderNameElement)
        this.collectContainer.elements.cardHolderNameElement.unmount();
      if ("unmount" in this.collectContainer.elements.cardNumberElement)
        this.collectContainer.elements.cardNumberElement.unmount();
      if ("unmount" in this.collectContainer.elements.expiryYearElement)
        this.collectContainer.elements.expiryYearElement.unmount();
      if ("unmount" in this.collectContainer.elements.expiryMonthElement)
        this.collectContainer.elements.expiryMonthElement.unmount();
      if ("unmount" in this.collectContainer.elements.cvvElement)
        this.collectContainer.elements.cvvElement.unmount();
    }
  }
}
