import { defaultStyles } from "./styles";

export async function initSkyflow(
  vaultId,
  vaultUrl,
  baseUrl,
  apiKey,
  signal,
  customStyles = {}
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

  const cardHolderNameElement = await collectContainer.create({
    table: "cards",
    column: "cardholder_name",
    ...collectStylesOptions,
    label: "Titular de la tarjeta",
    placeholder: "Nombre como aparece en la tarjeta",
    type: Skyflow.ElementType.CARDHOLDER_NAME,
    validations: [lengthMatchRule],
  });

  cardHolderNameElement.setError('Inválido')

  // Create collect elements.
  const cardNumberElement = await collectContainer.create({
    table: "cards",
    column: "card_number",
    ...collectStylesOptions,
    inputStyles: {
      ...collectStylesOptions.inputStyles,
      base: stylesForCardNumber
    },
    label: "Número de tarjeta",
    placeholder: "1234 1234 1234 1234",
    type: Skyflow.ElementType.CARD_NUMBER,
  });

  cardNumberElement.setError('Inválido')

  const cvvElement = await collectContainer.create({
    table: "cards",
    column: "cvv",
    ...collectStylesOptions,
    label: "CVC/CVV",
    placeholder: "3-4 dígitos",
    type: Skyflow.ElementType.CVV,
  });

  cvvElement.setError('Inválido')

  const expiryMonthElement = await collectContainer.create({
    table: "cards",
    column: "expiration_month",
    ...collectStylesOptions,
    label: "Fecha de expiración",
    placeholder: "MM",
    type: Skyflow.ElementType.EXPIRATION_MONTH,
  });

  expiryMonthElement.setError('Inválido')

  const expiryYearElement = await collectContainer.create({
    table: "cards",
    column: "expiration_year",
    ...collectStylesOptions,
    label: "",
    placeholder: "AA",
    type: Skyflow.ElementType.EXPIRATION_YEAR,
  });

  expiryYearElement.setError('Inválido')

  await mountElements(
    cardNumberElement,
    cvvElement,
    expiryMonthElement,
    expiryYearElement,
    cardHolderNameElement,
  )

  return collectContainer
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
