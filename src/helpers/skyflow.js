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
  var collectStylesOptionsTonder = {
    inputStyles: {
      base: {
        border: "1px solid #e0e0e0",
        padding: "10px 7px",
        borderRadius: "5px",
        color: "#1d1d1d",
        marginTop: "2px",
        backgroundColor: "white",
        fontFamily: '"Inter", sans-serif',
        fontSize: '16px',
        '&::placeholder': {
          color: "#ccc",
        },
      },
      cardIcon: {
        position: 'absolute',
        left: '6px',
        bottom: 'calc(50% - 12px)',
      },
      complete: {
        color: "#4caf50",
      },
      empty: {},
      focus: {},
      invalid: {
        border: "1px solid #f44336",
      },
      global: {
        '@import': 'url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap")',
      }
    },
    labelStyles: {
      base: {
        fontSize: '12px',
        fontWeight: '500',
        fontFamily: '"Inter", sans-serif'
      },
    },
    errorTextStyles: {
      base: {
        fontSize: '12px',
        fontWeight: '500',
        color: "#f44336",
        fontFamily: '"Inter", sans-serif'
      },
    },
  };

  const stylesForCardNumber = { ...collectStylesOptionsTonder.inputStyles.base };
  stylesForCardNumber.textIndent = '44px';

  const lengthMatchRule = {
    type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
    params: {
      max: 70,
    },
  };

  const cardHolderNameElementTonder = await collectContainerTonder.create({
    table: "cards",
    column: "cardholder_name",
    ...collectStylesOptionsTonder,
    label: "Titular de la tarjeta",
    placeholder: "Nombre como aparece en la tarjeta",
    type: Skyflow.ElementType.CARDHOLDER_NAME,
    validations: [lengthMatchRule],
  });

  // Create collect elements.
  const cardNumberElementTonder = await collectContainerTonder.create({
    table: "cards",
    column: "card_number",
    ...collectStylesOptionsTonder,
    inputStyles: {
      ...collectStylesOptionsTonder.inputStyles,
      base: stylesForCardNumber
    },
    label: "Número de tarjeta",
    placeholder: "1234 1234 1234 1234",
    type: Skyflow.ElementType.CARD_NUMBER,
  });

  const cvvElementTonder = await collectContainerTonder.create({
    table: "cards",
    column: "cvv",
    ...collectStylesOptionsTonder,
    label: "CVC/CVV",
    placeholder: "3-4 dígitos",
    type: Skyflow.ElementType.CVV,
  });

  const expiryMonthElementTonder = await collectContainerTonder.create({
    table: "cards",
    column: "expiration_month",
    ...collectStylesOptionsTonder,
    label: "Fecha de expiración",
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

  await mountElements(
    cardNumberElementTonder,
    cvvElementTonder,
    expiryMonthElementTonder,
    expiryYearElementTonder,
    cardHolderNameElementTonder,
  )

  return collectContainerTonder
}

async function mountElements(
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
