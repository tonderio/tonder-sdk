import { defaultStyles } from "./styles";
import {getVaultToken} from "../data/skyflowApi";
import {buildErrorResponseFromCatch} from "./utils";

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
      return await getVaultToken(baseUrl, apiKey, signal)
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
    "titular de la tarjeta",
    collectStylesOptions.errorTextStyles
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
    "número de tarjeta",
    collectStylesOptions.errorTextStyles
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
    "",
    collectStylesOptions.errorTextStyles
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
    "",
    collectStylesOptions.errorTextStyles
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
    "",
    collectStylesOptions.errorTextStyles
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


function handleSkyflowElementEvents(element, fieldMessage= "", error_styles = {}, resetOnFocus = true, requiredMessage = "El campo es requerido", invalidMessage= "El campo es inválido") {
  if ("on" in element) {
    element.on(Skyflow.EventName.CHANGE, (state) => {
      updateErrorLabel(element, error_styles, "transparent")
    });

    element.on(Skyflow.EventName.BLUR, (state) => {
      if (!state.isValid) {
        const msj_error = state.isEmpty ? requiredMessage : fieldMessage != "" ?`El campo ${fieldMessage} es inválido`: invalidMessage;
        element.setError(msj_error);
      }
      updateErrorLabel(element, error_styles)
    });

    element.on(Skyflow.EventName.FOCUS, (state) => {
      updateErrorLabel(element, error_styles, "transparent")
      element.resetError();
    });
  }
}

function updateErrorLabel(element, errorStyles, color = "" ){
  if(Object.keys(errorStyles).length > 0){
    element.update({
      errorTextStyles: {
        ...errorStyles,
        base: {
          ...(errorStyles.base && {...errorStyles.base}),
          ...(color != "" && {color})
        }
      }
    })
  }
}

export async  function getSkyflowTokens({baseUrl, apiKey, vault_id, vault_url, data }) {
  const skyflow = Skyflow.init({
    vaultID: vault_id,
    vaultURL: vault_url,
    getBearerToken: async () => await getVaultToken(baseUrl, apiKey),
    options: {
      logLevel: Skyflow.LogLevel.ERROR,
      env: Skyflow.Env.DEV,
    },
  });

  const collectContainer = skyflow.container(Skyflow.ContainerType.COLLECT);

  const fieldPromises = await getFieldsPromise(data, collectContainer);

  const result = await Promise.all(fieldPromises);
  const mountFail = result.some((item) => !item);

  if (mountFail) {
    throw buildErrorResponseFromCatch(
        Error("Ocurrió un error al montar los campos de la tarjeta"),
    );
  } else {
    try {
      const collectResponseSkyflowTonder = await collectContainer.collect();
      if (collectResponseSkyflowTonder)
        return collectResponseSkyflowTonder["records"][0]["fields"];
      throw buildErrorResponseFromCatch(
          Error("Por favor, verifica todos los campos de tu tarjeta"),
      );
    } catch (error) {
      throw buildErrorResponseFromCatch(error);
    }
  }
}
async function getFieldsPromise(data, collectContainer) {
  const fields = await getFields(data, collectContainer);
  if (!fields) return [];
  return fields.map((field) => {
    return new Promise((resolve) => {
      const div = document.createElement("div");
      div.hidden = true;
      div.id = `id-${field.key}`;
      document.querySelector(`body`)?.appendChild(div);
      setTimeout(() => {
        field.element.mount(`#id-${field.key}`);
        setInterval(() => {
          if (field.element.isMounted()) {
            const value = data[field.key];
            field.element.update({ value: value });
            return resolve(field.element.isMounted());
          }
        }, 120);
      }, 120);
    });
  })
}

async function getFields(data, collectContainer) {
  return await Promise.all(
      Object.keys(data).map(async (key) => {
        const cardHolderNameElement = await collectContainer.create({
          table: "cards",
          column: key,
          type: Skyflow.ElementType.INPUT_FIELD,
        });
        return { element: cardHolderNameElement, key: key };
      })
  )
}

