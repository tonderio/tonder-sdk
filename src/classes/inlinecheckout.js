export class InlineCheckout {
  constructor({
    form,
    radioName,
    apiKey,
    totalElementId,
    customer,
    items,
  }) {
    this.baseUrlTonder = "https://stage.tonder.io/api/v1/";
    this.apiKeyTonder = apiKey;
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

    this.addScripts();
  }

  addScripts() {
    const skyflow = document.createElement("script");
    skyflow.src = "https://js.skyflow.com/v1/index.js";
    const openPay1 = document.createElement("script");
    openPay1.src = "https://openpay.s3.amazonaws.com/openpay.v1.min.js";
    const openPay2 = document.createElement("script");
    openPay2.src =
      "https://openpay.s3.amazonaws.com/openpay-data.v1.min.js";

    document.head.appendChild(skyflow);
    document.head.appendChild(openPay1);
    document.head.appendChild(openPay2);
  }

  filtrarNumeros(cadena) {
    const numerosValidos = "0123456789.";
    let numerosFiltrados = "";

    for (let i = 0; i < cadena.length; i++) {
      const caracter = cadena[i];
      if (numerosValidos.includes(caracter)) {
        numerosFiltrados += caracter;
      }
    }

    return parseFloat(numerosFiltrados);
  }

  getInfoFromElements() {
    const payButton = document.querySelector("#tonderPayButton");
    const totalElement = document.getElementById("cart-total");
    this.total = this.filtrarNumeros(totalElement.textContent);
    payButton.textContent = `Pagar $${this.total}`;
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          this.total = this.filtrarNumeros(totalElement.textContent);
          payButton.textContent = `Pagar ${this.toCurrency(this.total)}`;
        }
      });
    });

    mutationObserver.observe(totalElement, {
      subtree: true,
      characterData: true,
    });
  }

  toCurrency(value) {
    if (isNaN(parseFloat(value))) {
      return value;
    }
    var formatter = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    });
    return formatter.format(value);
  }

  injectCheckout() {
    const injectInterval = setInterval(() => {
      if (document.querySelector("#tonder-checkout")) {
        document.querySelector("#tonder-checkout").innerHTML = `
<div class="container-tonder">
<p class="p-card-tonder">Titular de la tarjeta</p>
<div id="collectCardholderNameTonder" class="empty-div-tonder"></div>
<p class="p-card-tonder"> Información de la tarjeta</p>
<div id="collectCardNumberTonder" class="empty-div-tonder"></div>
<div class="collect-row-tonder">
<div id="collectExpirationMonthTonder" class="empty-div-dates-tonder"></div>
<div id="collectExpirationYearTonder" class="empty-div-dates-tonder"></div>
<div id="collectCvvTonder" class="empty-div-cvc-tonder"></div>
</div>
<div id="msgError"></div>
<div>
<div class="container-politics-tonder">
<input type="checkbox" id="acceptTonder" name="scales" checked>
<label class="terms-label-tonder" for="scales">
  He leído y estoy de acuerdo con los
  <a class="link-terms-tonder" href="https://uploads-ssl.webflow.com/64064b12c34bf2edb2b35b4b/64340cb7f63339f5e75eaf51_Te%CC%81rminos-y-Condiciones.cefc632e785489045e68.pdf" target="_blank">términos y condiciones</a>
  de este sitio web.
</label>
</div>
</div>
<button id="tonderPayButton" class="payButton">Pagar</button>
</div>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap');
.container-tonder {
width: 90% !important;
font-family: 'Inter', sans-serif;
margin: 0 auto !important;
max-height: 0px;
overflow: hidden;
transition: max-height 0.5s ease-out;
max-width: 600px;
}

.container-selected {
max-height: 100vh;
}

.p-card-tonder {
font-weight: bold !important;
font-size: 13px !important;
text-align: left;
}

.payment_method_zplit {
font-size: 16px !important;
width: 100% !important;
}

.payment_method_zplit  label img {
width: 68px !important;
padding-left: 1px !important;
}

.container-politics-tonder {
display: flex !important;
align-items: center !important;
margin-bottom: 2rem;
}

.politics-p-tonder {
font-size: 13px !important;
margin: 0 !important;
}

.terms-label-tonder {
font-size: 14px !important;
margin: 0 0 0 10px !important;
}

.collect-row-tonder {
display: flex !important;
justify-content: space-between !important;
width: 100% !important;
}

.collect-row-tonder > div {
width: calc(25% - 10px) !important;
}

.collect-row-tonder > div:last-child {
width: 50% !important;
}

.empty-div-tonder {
height: 65px !important;
}

.empty-div-dates-tonder {
height: 90px !important;
}

.empty-div-cvc-tonder {
height: 90px !important;
}

.reveal-view {
margin-top: 0px !important;
}

.error-tonder-container-tonder{
color: red !important;
background-color: #FFDBDB !important;
margin-bottom: 13px !important;
font-size: 80% !important;
padding: 8px 10px !important;
border-radius: 10px !important;
text-align: left !important;
}

.image-error-tonder {
width: 14px !important;
margin: -2px 5px !important;
}

.link-terms-tonder {
color: black !important;
}

.link-terms-tonder:hover {
text-decoration: None !important;
color: black !important;
}
.payButton {
font-size: 16px;
font-weight: bold;
min-height: 2.3rem;
border-radius: 0.5rem;
cursor: pointer;
width: 100%;
padding: 1rem;
text-align: center;
border: none;
background-color: #000;
color: #fff;
}

.error-custom-inputs-tonder{
margin-left: 4px !important;
margin-top: -22px !important;
font-size: 11px !important;
color: red !important;
text-align: left;
}

.error-custom-inputs-little-tonder{
margin-left: 4px !important;
margin-top: -46px !important;
font-size: 11px !important;
color: red !important;
text-align: left;
}

.lds-dual-ring {
display: inline-block;
width: 14px;
height: 14px;
}
.lds-dual-ring:after {
content: " ";
display: block;
width: 14px;
height: 14px;
border-radius: 50%;
border: 6px solid #fff;
border-color: #fff transparent #fff transparent;
animation: lds-dual-ring 1.2s linear infinite;
}
@keyframes lds-dual-ring {
0% {
transform: rotate(0deg);
}
100% {
transform: rotate(360deg);
}
}


@media screen and (max-width: 600px) {
.p-card-tonder {
  font-weight: bold !important;
  font-size: 13px !important;
  margin: 0 !important;
  padding: 0 !important;
}

.payment_method_zplit {
  font-size: 16px !important;
  width: 100% !important;
}

.payment_method_zplit  label img {
  display: none !important;
}

.empty-div-dates-tonder {
  height: 90px !important;
  width: 60px !important;
}

.empty-div-cvc-tonder {
  height: 90px !important;
  width: 130px !important;
}

}

</style>
`;
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
    var vaultdIdTonder;
    var vaultUrlTonder;
    var referenceTonder;
    var userKeyTonder;
    var businessPkTonder;
    var openpayMerchantIdTonder;
    var openpayPublicKeyTonder;
    this.getInfoFromElements();

    // -- Business' details --
    try {
      const responseBusinessTonder = await fetch(
        `${baseUrlTonder}payments/business/${apiKeyTonder}`,
        {
          headers: {
            Authorization: `Token ${apiKeyTonder}`,
          },
        }
      );
      const dataBusinessTonder = await responseBusinessTonder.json();

      // Response data
      vaultdIdTonder = dataBusinessTonder.vault_id;
      vaultUrlTonder = dataBusinessTonder.vault_url;
      referenceTonder = dataBusinessTonder.reference;
      businessPkTonder = dataBusinessTonder.business.pk;

      // Openpay
      openpayMerchantIdTonder =
        dataBusinessTonder.openpay_keys.merchant_id;
      openpayPublicKeyTonder = dataBusinessTonder.openpay_keys.public_key;
    } catch (error) {
      console.log(error);
    }

    // --- Skyflow ---
    const skyflowTonder = await Skyflow.init({
      vaultID: vaultdIdTonder,
      vaultURL: vaultUrlTonder,
      getBearerToken: () => {
        return new Promise((resolve, reject) => {
          const Http = new XMLHttpRequest();
          Http.onreadystatechange = () => {
            if (Http.readyState === 4 && Http.status >= 200 && Http.status <= 299) {
              const response = JSON.parse(Http.responseText);
              resolve(response.token);
            }
          };
          const url = `${baseUrlTonder}vault-token/`;
          Http.open("GET", url);
          Http.setRequestHeader("Authorization", `Token ${apiKeyTonder}`);
          Http.send();
        });
      },

      options: {
        logLevel: Skyflow.LogLevel.ERROR,
        // Actual value of element can only be accessed inside the handler,
        // when the env is set to DEV.
        // Make sure the env is set to PROD when using skyflow-js in production
        env: Skyflow.Env.DEV,
      },
    });

    // Create collect Container.
    const collectContainerTonder = await skyflowTonder.container(
      Skyflow.ContainerType.COLLECT
    );
    // Custom styles for collect elements.
    const collectStylesOptionsTonder = {
      inputStyles: {
        base: {
          border: "3px solid #eae8ee !important",
          padding: "10px 16px !important",
          borderRadius: "10px !important",
          color: "#1d1d1d !important",
          marginTop: "0px !important",
          backgroundColor: "white !important",
        },
        complete: {
          color: "#4caf50 !important",
        },
        empty: {},
        focus: {},
        invalid: {
          color: "red !important",
          backgroundColor: "#FFDBDB !important",
        },
      },
      labelStyles: {
        base: {
          fontSize: "16px !important",
          fontWeight: "bold !important",
        },
      },
      errorTextStyles: {
        base: {
          color: "red !important",
          fontSize: "0px !important",
        },
      },
    };

    // Create collect elements.
    const cardNumberElementTonder = await collectContainerTonder.create({
      table: "cards",
      column: "card_number",
      ...collectStylesOptionsTonder,
      label: "",
      placeholder: "Número de tarjeta",
      type: Skyflow.ElementType.CARD_NUMBER,
    });

    const cvvElementTonder = await collectContainerTonder.create({
      table: "cards",
      column: "cvv",
      ...collectStylesOptionsTonder,
      label: "",
      placeholder: "CVC",
      type: Skyflow.ElementType.CVV,
    });

    const expiryMonthElementTonder = await collectContainerTonder.create({
      table: "cards",
      column: "expiration_month",
      ...collectStylesOptionsTonder,
      label: "",
      placeholder: "MM",
      type: Skyflow.ElementType.EXPIRATION_MONTH,
    });

    const expiryYearElementTonder = await collectContainerTonder.create({
      table: "cards",
      column: "expiration_year",
      ...collectStylesOptionsTonder,
      label: "",
      placeholder: "AA",
      type: Skyflow.ElementType.EXPIRATION_YEAR,
    });

    const lengthMatchRule = {
      type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
      params: {
        max: 70,
      },
    };

    const cardHolderNameElementTonder =
      await collectContainerTonder.create({
        table: "cards",
        column: "cardholder_name",
        ...collectStylesOptionsTonder,
        label: "",
        placeholder: "Nombre como aparece en la tarjeta",
        type: Skyflow.ElementType.CARDHOLDER_NAME,
        validations: [lengthMatchRule],
      });

    // Mount the elements.
    cardNumberElementTonder.mount("#collectCardNumberTonder");
    cvvElementTonder.mount("#collectCvvTonder");
    expiryMonthElementTonder.mount("#collectExpirationMonthTonder");
    expiryYearElementTonder.mount("#collectExpirationYearTonder");
    cardHolderNameElementTonder.mount("#collectCardholderNameTonder");

    cardNumberElementTonder.on(Skyflow.EventName.BLUR, (state) => {
      var tonderContainerNumber = document.getElementById(
        "collectCardNumberTonder"
      );
      var existingErrorLabelCarHolderTonder =
        document.getElementById("errorNumberTonder");

      if (existingErrorLabelCarHolderTonder) {
        existingErrorLabelCarHolderTonder.remove();
      }

      if (!state.isValid) {
        var errorLabel = document.createElement("p");
        errorLabel.classList.add("error-custom-inputs-tonder");
        errorLabel.id = "errorNumberTonder";
        errorLabel.textContent = "No válido";
        tonderContainerNumber.appendChild(errorLabel);
      }
    });

    cvvElementTonder.on(Skyflow.EventName.BLUR, (state) => {
      var tonderContainerNumber =
        document.getElementById("collectCvvTonder");
      var existingErrorCVVTonder =
        document.getElementById("errorCVVTonder");

      if (existingErrorCVVTonder) {
        existingErrorCVVTonder.remove();
      }

      if (!state.isValid) {
        var errorLabel = document.createElement("p");
        errorLabel.classList.add("error-custom-inputs-little-tonder");
        errorLabel.id = "errorCVVTonder";
        errorLabel.textContent = "No válido";
        tonderContainerNumber.appendChild(errorLabel);
      }
    });

    expiryMonthElementTonder.on(Skyflow.EventName.BLUR, (state) => {
      var tonderContainerNumber = document.getElementById(
        "collectExpirationMonthTonder"
      );
      var existingErrorExpMonthTonder = document.getElementById(
        "errorExpMonthTonder"
      );

      if (existingErrorExpMonthTonder) {
        existingErrorExpMonthTonder.remove();
      }

      if (!state.isValid) {
        var errorLabel = document.createElement("p");
        errorLabel.classList.add("error-custom-inputs-little-tonder");
        errorLabel.id = "errorExpMonthTonder";
        errorLabel.textContent = "No válido";
        tonderContainerNumber.appendChild(errorLabel);
      }
    });

    expiryYearElementTonder.on(Skyflow.EventName.BLUR, (state) => {
      var tonderContainerNumber = document.getElementById(
        "collectExpirationYearTonder"
      );
      var existingErrorExpYearTonder =
        document.getElementById("errorExpYearTonder");

      if (existingErrorExpYearTonder) {
        existingErrorExpYearTonder.remove();
      }

      if (!state.isValid) {
        var errorLabel = document.createElement("p");
        errorLabel.classList.add("error-custom-inputs-little-tonder");
        errorLabel.id = "errorExpYearTonder";
        errorLabel.textContent = "No válido";
        tonderContainerNumber.appendChild(errorLabel);
      }
    });

    cardHolderNameElementTonder.on(Skyflow.EventName.BLUR, (state) => {
      var tonderContainerCardHolder = document.getElementById(
        "collectCardholderNameTonder"
      );
      var existingErrorLabelCarHolderTonder = document.getElementById(
        "errorCardHolderIdTonder"
      );

      if (existingErrorLabelCarHolderTonder) {
        existingErrorLabelCarHolderTonder.remove();
      }

      if (!state.isValid) {
        var errorLabel = document.createElement("p");
        errorLabel.classList.add("error-custom-inputs-tonder");
        errorLabel.id = "errorCardHolderIdTonder";
        errorLabel.textContent = "No válido";
        tonderContainerCardHolder.appendChild(errorLabel);
      }
    });

    const CheckDuplicateIframes = () => {
      // Verify the first iframe
      var containerCollectCardNumberTonder = document.getElementById(
        "collectCardNumberTonder"
      );
      var iframes =
        containerCollectCardNumberTonder.getElementsByTagName("iframe");

      if (iframes.length > 1) {
        location.reload();
      }
    };

    // Check if there are duplicates
    CheckDuplicateIframes();

    // --- End skyflow ---

    // --- Tokenization ---

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
        const collectResponseSkyflowTonder =
          await collectContainerTonder.collect();
        cardTokensSkyflowTonder = await collectResponseSkyflowTonder[
          "records"
        ][0]["fields"];
      } catch (error) {
        var msgErrorDiv = document.getElementById("msgError");
        msgErrorDiv.classList.add("error-tonder-container-tonder");
        msgErrorDiv.innerHTML =
          "Por favor, verifica todos los campos de tu tarjeta";
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
        const jsonResponseUser = await clientRegisterTonder(billingEmail);
        userKeyTonder = jsonResponseUser.token;

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
        const jsonResponseOrder = await createOrderTonder(orderItems);

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
          paymentItems
        );

        // Checkout router
        const routerItems = {
          card: cardTokensSkyflowTonder,
          name: cardTokensSkyflowTonder.cardholder_name,
          last_name: "",
          email_client: billingEmail,
          phone_number: billingPhone,
          id_product: "no_id",
          quantity_product: 1,
          id_ship: "0",
          instance_id_ship: "0",
          amount: total,
          title_ship: "shipping",
          description: "transaction",
          device_session_id: deviceSessionIdTonder
            ? deviceSessionIdTonder
            : null,
          token_id: "",
          order_id: jsonResponseOrder.id,
          business_id: businessPkTonder,
          payment_id: jsonResponsePayment.pk,
        };
        const jsonResponseRouter = await createCheckoutRouterTonder(
          routerItems
        );

        if (jsonResponseRouter) {
          document.querySelector("#tonderPayButton").disabled = false;
          return true;
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
        this.form.submit();
      }
    });

    if (!this.radioName) {
      document
        .querySelector(".container-tonder")
        .classList.add("container-selected");
    } else {
      const radios = document.querySelectorAll(
        `input[type=radio][name=${this.radioName}]`
      );
      radios.forEach((radio) =>
        radio.addEventListener("change", () => {
          console.log(radio);

          if (radio.id === "tonder-pay") {
            document
              .querySelector(".container-tonder")
              .classList.add("container-selected");
          } else {
            document
              .querySelector(".container-tonder")
              .classList.remove("container-selected");
          }
        })
      );
    }

    // --- Request to backend ---
    // -- Register user --
    async function clientRegisterTonder(email) {
      // Verify if the email is registered
      const url = `${baseUrlTonder}client-existence/${email}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Token ${apiKeyTonder}`,
        },
      });
      if (response.status >= 200 && response.status <= 299) {
        const jsonResponse = await response.json();
        if (jsonResponse.message === true) {
          return await activation(email);
        } else {
          return await registration(email);
        }
      } else {
        throw new Error(`Error: ${response.statusText}`);
      }
    }

    async function registration(email) {
      const url = `${baseUrlTonder}customer-register/`;
      const data = {
        email: email,
        password: "",
        repeat_password: "",
      };
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${apiKeyTonder}`,
        },
        body: JSON.stringify(data),
      });

      if (response.status === 201) {
        const jsonResponse = await activation(email);
        return jsonResponse;
      } else {
        throw new Error(`Error: ${response.statusText}`);
      }
    }

    async function activation(email) {
      const url = `${baseUrlTonder}activate-customer/`;
      const data = { email: email };
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${apiKeyTonder}`,
        },
        body: JSON.stringify(data),
      });
      if (response.status >= 200 && response.status <= 299) {
        const jsonResponse = await response.json();
        return jsonResponse;
      } else {
        throw new Error(`Error: ${response.statusText}`);
      }
    }

    // -- Create order --
    async function createOrderTonder(orderItems) {
      const url = `${baseUrlTonder}orders/`;
      const data = orderItems;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${apiKeyTonder}`,
        },
        body: JSON.stringify(data),
      });
      if (response.status === 201) {
        const jsonResponse = await response.json();
        return jsonResponse;
      } else {
        throw new Error(`Error: ${response.statusText}`);
      }
    }

    // -- Create payment --
    async function createPaymentTonder(paymentItems) {
      const url = `${baseUrlTonder}business/${paymentItems.business_pk}/payments/`;
      const data = paymentItems;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${apiKeyTonder}`,
        },
        body: JSON.stringify(data),
      });
      if (response.status >= 200 && response.status <=299) {
        const jsonResponse = await response.json();
        return jsonResponse;
      } else {
        throw new Error(`Error: ${response.statusText}`);
      }
    }

    // -- Create payment with router --
    async function createCheckoutRouterTonder(routerItems) {
      const url = `${baseUrlTonder}checkout-router/`;
      const data = routerItems;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${apiKeyTonder}`,
        },
        body: JSON.stringify(data),
      });
      if (response.status >= 200 && response.status <= 299) {
        const jsonResponse = await response.json();
        console.log(jsonResponse)
        return true;
      } else {
        return false;
      }
    }

    // -- Openpay --
    async function openpayCheckoutTonder(merchant_id, public_key) {
      let openpay = await window.OpenPay;
      openpay.setId(merchant_id);
      openpay.setApiKey(public_key);
      openpay.setSandboxMode(true);
      var response = await openpay.deviceData.setup();
      return response;
    }

    // --- End request to backend ---

    // --- End tokenization ---
  }
}