export async function addScripts() {
  try {
    const skyflowScript = document.createElement("script");
    skyflowScript.src = "https://js.skyflow.com/v1/index.js";
    await new Promise((resolve, reject) => {
      skyflowScript.onload = resolve;
      skyflowScript.onerror = reject;
      document.head.appendChild(skyflowScript);
    });

    const openPay1Script = document.createElement("script");
    openPay1Script.src = "https://openpay.s3.amazonaws.com/openpay.v1.min.js";
    await new Promise((resolve, reject) => {
      openPay1Script.onload = resolve;
      openPay1Script.onerror = reject;
      document.head.appendChild(openPay1Script);
    });

    const openPay2Script = document.createElement("script");
    openPay2Script.src = "https://openpay.s3.amazonaws.com/openpay-data.v1.min.js";
    await new Promise((resolve, reject) => {
      openPay2Script.onload = resolve;
      openPay2Script.onerror = reject;
      document.head.appendChild(openPay2Script);
    });

  } catch (error) {
    console.error("Error loading scripts", error);
  }
}

export function filtrarNumeros(cadena) {
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

export function toCurrency(value) {
  if (isNaN(parseFloat(value))) {
    return value;
  }
  var formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2
  });
  return formatter.format(value);
}

export async function mountElements(
  cardNumberElementTonder,
  cvvElementTonder,
  expiryMonthElementTonder,
  expiryYearElementTonder,
  cardHolderNameElementTonder,
) {
  cardNumberElementTonder.mount("#collectCardNumberTonder");
  cvvElementTonder.mount("#collectCvvTonder");
  expiryMonthElementTonder.mount("#collectExpirationMonthTonder");
  expiryYearElementTonder.mount("#collectExpirationYearTonder");
  cardHolderNameElementTonder.mount("#collectCardholderNameTonder");
}

export async function initSkyflow(
  vaultIdTonder,
  vaultUrlTonder,
  baseUrlTonder,
  apiKeyTonder,
  signal
) {
  const skyflowTonder = await Skyflow.init({
    vaultID: vaultIdTonder,
    vaultURL: vaultUrlTonder,
    getBearerToken: async () => {
      // Pass the signal to the fetch call
      const response = await fetch(`${baseUrlTonder}/api/v1/vault-token/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${apiKeyTonder}`,
        },
        signal: signal,
      });

      if (response.ok) {
        const responseBody = await response.json();
        return responseBody.token;
      } else {
        throw new Error('Failed to retrieve bearer token');
      }
    },
    options: {
      logLevel: Skyflow.LogLevel.ERROR,
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

  await mountElements(
    cardNumberElementTonder,
    cvvElementTonder,
    expiryMonthElementTonder,
    expiryYearElementTonder,
    cardHolderNameElementTonder,
  )

  return collectContainerTonder
}
