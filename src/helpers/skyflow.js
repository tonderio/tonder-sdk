import { defaultStyles } from "./styles";

export async function initSkyflow(
  vaultId,
  vaultUrl,
  baseUrl,
  apiKey,
  signal,
  customStyles = {},
  collectorIds,
) {
  const skyflow = await Skyflow.init({
    vaultID: vaultId,
    vaultURL: vaultUrl,
    getBearerToken: async () => {
      // Pass the signal to the fetch call
      const response = await fetch(`${baseUrl}/api/v1/vault-token/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${apiKey}`,
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
  const collectContainer = await skyflow.container(
    Skyflow.ContainerType.COLLECT
  );

  // Custom styles for collect elements.
  var collectStylesOptions = Object.keys(customStyles).length === 0 ? defaultStyles : customStyles

  const stylesForCardNumber = { ...collectStylesOptions.inputStyles.base };
  stylesForCardNumber.textIndent = '44px';

  const lengthMatchRule = {
    type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
    params: {
      max: 70,
    },
  };
  const regexEmpty = RegExp("^(?!\s*$).+");

  const regexMatchRule = {
    type: Skyflow.ValidationRuleType.REGEX_MATCH_RULE,
    params: {
      regex: regexEmpty,
      error: "El campo es requerido" // Optional, default error is 'VALIDATION FAILED'.
    }
  }

  const cardHolderNameElement = await collectContainer.create({
    table: "cards",
    column: "cardholder_name",
    ...collectStylesOptions,
    label: collectStylesOptions.labels?.nameLabel,
    placeholder: collectStylesOptions.placeholders?.namePlaceholder,
    type: Skyflow.ElementType.CARDHOLDER_NAME,
    validations: [lengthMatchRule, regexMatchRule],
  });

  handleSkyflowElementEvents(
    cardHolderNameElement,
    collectorIds.holderName,
    "errorCardHolderIdTonder",
    "titular de la tarjeta"
  );

  // Create collect elements.
  const cardNumberElement = await collectContainer.create({
    table: "cards",
    column: "card_number",
    ...collectStylesOptions,
    inputStyles: {
      ...collectStylesOptions.inputStyles,
      base: stylesForCardNumber
    },
    label: collectStylesOptions.labels?.cardLabel,
    placeholder: collectStylesOptions.placeholders?.cardPlaceholder,
    type: Skyflow.ElementType.CARD_NUMBER,
    validations: [regexMatchRule],
  });

  handleSkyflowElementEvents(
    cardNumberElement,
    collectorIds.cardNumber,
    "errorCardNumberIdTonder",
    "número de tarjeta"
  );


  const cvvElement = await collectContainer.create({
    table: "cards",
    column: "cvv",
    ...collectStylesOptions,
    label: collectStylesOptions.labels?.cvvLabel,
    placeholder: collectStylesOptions.placeholders?.cvvPlaceholder,
    type: Skyflow.ElementType.CVV,
    validations: [regexMatchRule],
  });

  handleSkyflowElementEvents(
    cvvElement,
    collectorIds.cvv,
    "errorCvvIdTonder"
  );

  const expiryMonthElement = await collectContainer.create({
    table: "cards",
    column: "expiration_month",
    ...collectStylesOptions,
    label: collectStylesOptions.labels?.expiryDateLabel,
    placeholder: collectStylesOptions.placeholders?.expiryMonthPlaceholder,
    type: Skyflow.ElementType.EXPIRATION_MONTH,
    validations: [regexMatchRule],
  });

  handleSkyflowElementEvents(
    expiryMonthElement,
    collectorIds.expirationMonth,
    "errorExpiryMonthIdTonder"
  );

  const expiryYearElement = await collectContainer.create({
    table: "cards",
    column: "expiration_year",
    ...collectStylesOptions,
    label: "",
    placeholder: collectStylesOptions.placeholders?.expiryYearPlaceholder,
    type: Skyflow.ElementType.EXPIRATION_YEAR,
    validations: [regexMatchRule],
  });

  handleSkyflowElementEvents(
    expiryYearElement,
    collectorIds.expirationYear,
    "errorExpiryYearIdTonder"
  );

  await mountElements(
    cardNumberElement,
    cvvElement,
    expiryMonthElement,
    expiryYearElement,
    cardHolderNameElement,
  )

  return {
    container: collectContainer,
    elements: { 
      cardHolderNameElement, 
      cardNumberElement, 
      cvvElement, 
      expiryMonthElement, 
      expiryYearElement 
    } 
  }
}

async function mountElements(
  cardNumberElement,
  cvvElement,
  expiryMonthElement,
  expiryYearElement,
  cardHolderNameElement,
) {
  cardNumberElement.mount("#collectCardNumber");
  cvvElement.mount("#collectCvv");
  expiryMonthElement.mount("#collectExpirationMonth");
  expiryYearElement.mount("#collectExpirationYear");
  cardHolderNameElement.mount("#collectCardholderName");
}


function handleSkyflowElementEvents(element, elementId, errorElementId, fieldMessage= "", requiredMessage = "El campo es requerido", invalidMessage= "El campo es inválido") {
  if ("on" in element) {
    element.on(Skyflow.EventName.CHANGE, (state) => {
      let errorElement = document.getElementById(errorElementId);
      if (errorElement && state.isValid && !state.isEmpty) {
        errorElement.remove();
      }
    });

    element.on(Skyflow.EventName.BLUR, (state) => {
      let container = document.getElementById(elementId);
      let errorElement = document.getElementById(errorElementId);
      if (errorElement) {
        errorElement.remove();
      }
      if (!state.isValid) {
        let errorLabel = document.createElement("div");
        errorLabel.classList.add("error-custom-inputs-tonder");
        errorLabel.id = errorElementId;
        errorLabel.textContent = state.isEmpty ? requiredMessage : fieldMessage != "" ?`El campo ${fieldMessage} es inválido`: invalidMessage;
        container?.appendChild(errorLabel);
      }
    });
  }
}