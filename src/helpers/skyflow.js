import { getDefaultStyles, defaultStyles, DEFAULT_LABELS, DEFAULT_PLACEHOLDERS } from "./styles";
import { getVaultToken } from "../data/skyflowApi";
import { getCardFormLabels } from "./utils";
import { DISPLAY_MODE } from "../shared/constants/displayMode";

// Validation rules — shared by initSkyflow and mountSkyflowFields
const lengthMatchRule = {
  type: Skyflow.ValidationRuleType.LENGTH_MATCH_RULE,
  params: {
    max: 70,
  },
};

const regexEmpty = RegExp("^(?!\s*$).+");
const regexMatchRule = {
  type: "REGEX_MATCH_RULE",
  params: {
    regex: regexEmpty,
    error: "El campo es requerido", // Optional, default error is 'VALIDATION FAILED'.
  },
};

// Maps Skyflow column names to ICardStyles keys — shared by initSkyflow and mountSkyflowFields
const fieldToStyleKey = {
  cardholder_name: "cardholderName",
  card_number: "cardNumber",
  cvv: "cvv",
  expiration_month: "expirationMonth",
  expiration_year: "expirationYear",
};

/**
 * Resolves styles for a field with precedence: per-field → cardForm → defaultStyles.
 * Translates developer's `errorStyles` key to Skyflow's `errorTextStyles`.
 * @param {string} field - Skyflow column name (e.g. "card_number").
 * @param {object} styles - ICardStyles object (may be empty/undefined).
 */
function getFieldStyles(field, styles) {
  const perField = styles && styles[fieldToStyleKey[field]];
  const form = styles && styles.cardForm;

  const resolvedInputStyles =
    (perField && perField.inputStyles) || (form && form.inputStyles) || defaultStyles.inputStyles;

  // Card icon padding: inject paddingLeft so text doesn't overlap the icon
  const iconVisible = field === "card_number" && !(styles && styles.enableCardIcon === false);
  const inputStyles = iconVisible
    ? {
        ...resolvedInputStyles,
        base: {
          paddingLeft: "15px",
          ...(resolvedInputStyles.base || {}),
        },
      }
    : resolvedInputStyles;

  return {
    inputStyles,
    labelStyles:
      (perField && perField.labelStyles) || (form && form.labelStyles) || defaultStyles.labelStyles,
    // Developer uses errorStyles; translate to Skyflow's errorTextStyles
    errorTextStyles:
      (perField && perField.errorStyles) ||
      (form && form.errorStyles) ||
      defaultStyles.errorTextStyles,
  };
}

export async function initSkyflow(
  vaultId,
  vaultUrl,
  baseUrl,
  apiKey,
  signal,
  customStyles = {},
  collectorIds,
  displayMode,
  mode,
  events = {},
) {
  const skyflow = await initializeSkyflow(vaultId, vaultUrl, baseUrl, apiKey, signal, mode);

  // Create collect Container.
  const collectContainer = await skyflow.container(Skyflow.ContainerType.COLLECT);

  // Resolve labels/placeholders from defaults + any label-specific overrides.
  const collectStylesOptions = {
    ...getDefaultStyles(displayMode === DISPLAY_MODE.dark),
    ...getCardFormLabels(customStyles),
  };

  // Per-field event callbacks
  const eventsByField = {
    card_number: events && events.cardNumberEvents,
    cvv: events && events.cvvEvents,
    expiration_month: events && events.monthEvents,
    expiration_year: events && events.yearEvents,
    cardholder_name: events && events.cardHolderEvents,
  };

  const holderStyles = getFieldStyles("cardholder_name", customStyles);
  const cardHolderNameElement = await collectContainer.create({
    table: "cards",
    column: "cardholder_name",
    ...holderStyles,
    label: collectStylesOptions.labels?.nameLabel,
    placeholder: collectStylesOptions.placeholders?.namePlaceholder,
    type: Skyflow.ElementType.CARDHOLDER_NAME,
    validations: [lengthMatchRule, regexMatchRule],
  });

  handleSkyflowElementEvents({
    element: cardHolderNameElement,
    fieldMessage: collectStylesOptions.labels?.nameLabel,
    errorStyles: holderStyles.errorTextStyles,
    events: eventsByField.cardholder_name,
  });

  // Create collect elements.
  const cardNumStyles = getFieldStyles("card_number", customStyles);
  const cardNumberElement = await collectContainer.create({
    table: "cards",
    column: "card_number",
    ...cardNumStyles,
    label: collectStylesOptions.labels?.cardLabel,
    placeholder: collectStylesOptions.placeholders?.cardPlaceholder,
    type: Skyflow.ElementType.CARD_NUMBER,
    validations: [regexMatchRule],
  });

  handleSkyflowElementEvents({
    element: cardNumberElement,
    fieldMessage: collectStylesOptions.labels?.cardLabel,
    errorStyles: cardNumStyles.errorTextStyles,
    events: eventsByField.card_number,
  });

  const monthStyles = getFieldStyles("expiration_month", customStyles);
  const expiryMonthElement = await collectContainer.create({
    table: "cards",
    column: "expiration_month",
    ...monthStyles,
    inputStyles: {
      ...monthStyles.inputStyles,
      base: {
        ...monthStyles.inputStyles?.base,
        borderBottomRightRadius: 0,
        borderTopRightRadius: 0,
      },
    },
    label: "",
    placeholder: collectStylesOptions.placeholders?.expiryMonthPlaceholder,
    type: Skyflow.ElementType.EXPIRATION_MONTH,
    validations: [regexMatchRule],
  });

  handleSkyflowElementEvents({
    element: expiryMonthElement,
    errorStyles: monthStyles.errorTextStyles,
    requiredMessage: "Campo requerido",
    events: eventsByField.expiration_month,
  });

  const yearStyles = getFieldStyles("expiration_year", customStyles);
  const expiryYearElement = await collectContainer.create({
    table: "cards",
    column: "expiration_year",
    ...yearStyles,
    inputStyles: {
      ...yearStyles.inputStyles,
      base: {
        ...yearStyles.inputStyles?.base,
        borderBottomLeftRadius: 0,
        borderTopLeftRadius: 0,
        borderLeft: "1px solid #CED0D1",
      },
    },
    label: "",
    placeholder: collectStylesOptions.placeholders?.expiryYearPlaceholder,
    type: Skyflow.ElementType.EXPIRATION_YEAR,
    validations: [regexMatchRule],
  });

  handleSkyflowElementEvents({
    element: expiryYearElement,
    errorStyles: yearStyles.errorTextStyles,
    events: eventsByField.expiration_year,
  });

  const cvvStyles = getFieldStyles("cvv", customStyles);
  const cvvElement = await collectContainer.create({
    table: "cards",
    column: "cvv",
    ...cvvStyles,
    label: "",
    placeholder: collectStylesOptions.placeholders?.cvvPlaceholder,
    type: Skyflow.ElementType.CVV,
    validations: [regexMatchRule],
  });

  handleSkyflowElementEvents({
    element: cvvElement,
    errorStyles: cvvStyles.errorTextStyles,
    events: eventsByField.cvv,
  });

  const elementsConfig = {
    cardNumber: {
      element: cardNumberElement,
      container: "#collectCardNumber",
    },
    cvv: {
      element: cvvElement,
      container: "#collectCvv",
    },
    expiryMonth: {
      element: expiryMonthElement,
      container: "#collectExpirationMonth",
    },
    expiryYear: {
      element: expiryYearElement,
      container: "#collectExpirationYear",
    },
    cardHolderName: {
      element: cardHolderNameElement,
      container: "#collectCardholderName",
    },
  };

  await mountElements(elementsConfig);
  return {
    container: collectContainer,
    elements: {
      cardHolderNameElement,
      cardNumberElement,
      cvvElement,
      expiryMonthElement,
      expiryYearElement,
    },
  };
}

export async function initUpdateSkyflow(
  skyflowId,
  vaultId,
  vaultUrl,
  baseUrl,
  apiKey,
  signal,
  customStyles = {},
  displayMode,
  mode,
  events = {},
) {
  const skyflow = await initializeSkyflow(vaultId, vaultUrl, baseUrl, apiKey, signal, mode);

  const collectStylesOptions = {
    ...getDefaultStyles(displayMode === DISPLAY_MODE.dark),
    ...getCardFormLabels(customStyles),
  };
  // Create collect Container.
  const collectContainer = await skyflow.container(Skyflow.ContainerType.COLLECT);

  const cvvStyles = getFieldStyles("cvv", customStyles);
  const cvvElement = await collectContainer.create({
    table: "cards",
    column: "cvv",
    ...cvvStyles,
    label: "",
    placeholder: collectStylesOptions.placeholders?.cvvPlaceholder,
    type: Skyflow.ElementType.CVV,
    validations: [regexMatchRule],
    skyflowID: skyflowId,
  });

  handleSkyflowElementEvents({
    element: cvvElement,
    errorStyles: cvvStyles.errorTextStyles,
    events: events && events.cvvEvents,
  });

  const elementsConfig = {
    cvv: {
      element: cvvElement,
      container: `#collectCvv${skyflowId}`,
    },
  };
  await mountElements(elementsConfig);

  return {
    container: collectContainer,
    elements: {
      cvvElement,
    },
  };
}

/**
 * Initializes a Skyflow instance. Shared by all checkout classes.
 * @param {string} vaultId
 * @param {string} vaultUrl
 * @param {string} baseUrl
 * @param {string} apiKey
 * @param {AbortSignal|null} signal
 * @param {string} [mode] - 'production' maps to Skyflow.Env.PROD; all others use DEV.
 * @returns {Promise<object>} Skyflow instance
 */
export async function initializeSkyflow(vaultId, vaultUrl, baseUrl, apiKey, signal, mode) {
  const env = mode === "production" ? Skyflow.Env.PROD : Skyflow.Env.DEV;
  return await Skyflow.init({
    vaultID: vaultId,
    vaultURL: vaultUrl,
    getBearerToken: async () => {
      // Pass the signal to the fetch call
      return await getVaultToken(baseUrl, apiKey, signal);
    },
    options: {
      logLevel: Skyflow.LogLevel.ERROR,
      env,
    },
  });
}

async function mountElements(elementsConfig) {
  if (typeof elementsConfig !== "object" || elementsConfig === null) {
    throw new Error("Invalid configuration object");
  }

  for (const [elementKey, { element, container }] of Object.entries(elementsConfig)) {
    if (element && container) {
      element.mount(container);
    } else {
      console.warn(`Skipping mount for '${elementKey}' due to missing element or container.`);
    }
  }
}

/**
 * Attaches event handlers to a Skyflow collect element.
 * Supports per-field event callbacks and corrects BLUR order:
 * updateErrorLabel (element.update) runs BEFORE element.setError() so the
 * custom error message is not overwritten.
 *
 * @param {object} params
 * @param {object} params.element
 * @param {string} [params.fieldMessage=""]
 * @param {object} [params.errorStyles={}]
 * @param {string} [params.requiredMessage="Campo requerido"]
 * @param {string} [params.invalidMessage="Campo inválido"]
 * @param {object} [params.events] - { onChange, onFocus, onBlur }
 */
function handleSkyflowElementEvents({
  element,
  fieldMessage = "",
  errorStyles = {},
  requiredMessage = "Campo requerido",
  invalidMessage = "Campo inválido",
  events,
}) {
  if (!("on" in element)) return;

  element.on(Skyflow.EventName.CHANGE, state => {
    executeEvent("onChange", state, events);
    updateErrorLabel(element, errorStyles, "transparent");
  });

  element.on(Skyflow.EventName.BLUR, state => {
    executeEvent("onBlur", state, events);
    if (!state.isValid) {
      const msj_error = state.isEmpty
        ? requiredMessage
        : fieldMessage !== ""
          ? `El campo ${fieldMessage} no es válido`
          : invalidMessage;
      element.setError(msj_error); // setError FIRST — element.update() must run after or it overwrites the message
    }
    updateErrorLabel(element, errorStyles);
  });

  element.on(Skyflow.EventName.FOCUS, state => {
    executeEvent("onFocus", state, events);
    updateErrorLabel(element, errorStyles, "transparent");
    element.resetError();
  });
}

function updateErrorLabel(element, errorStyles, color = "") {
  if (Object.keys(errorStyles).length > 0) {
    element.update({
      errorTextStyles: {
        ...errorStyles,
        base: {
          ...(errorStyles.base && { ...errorStyles.base }),
          ...(color != "" && { color }),
        },
      },
    });
  }
}

/**
 * Mounts Skyflow collect elements (secure iframes) into developer-provided containers.
 *
 * @param {object} params
 * @param {object} params.skyflowInstance - A Skyflow instance from initializeSkyflow().
 * @param {object} params.data - Mount request.
 * @param {Array<string|{field: string, container_id?: string}>} params.data.fields
 *   - String array: defaults containers to #collect_<field>
 *   - Object array: use container_id for custom containers
 * @param {string} [params.data.card_id] - Skyflow ID for saved-card CVV update flow.
 * @param {object} [params.customization] - Style/label/placeholder overrides.
 * @param {object} [params.events] - Per-field event handlers.
 * @returns {Promise<{elements: Array, container: object}>}
 */
export async function mountSkyflowFields({ skyflowInstance, data, customization, events }) {
  const collectContainer = skyflowInstance.container(Skyflow.ContainerType.COLLECT);
  const mountedElements = [];

  const typeByField = {
    card_number: Skyflow.ElementType.CARD_NUMBER,
    cvv: Skyflow.ElementType.CVV,
    expiration_month: Skyflow.ElementType.EXPIRATION_MONTH,
    expiration_year: Skyflow.ElementType.EXPIRATION_YEAR,
    cardholder_name: Skyflow.ElementType.CARDHOLDER_NAME,
  };

  const validationsByField = {
    card_number: [regexMatchRule],
    cvv: [regexMatchRule],
    expiration_month: [regexMatchRule],
    expiration_year: [regexMatchRule],
    cardholder_name: [lengthMatchRule, regexMatchRule],
  };

  const styles = customization && customization.styles;

  // Resolve labels/placeholders — developer overrides → DEFAULT_LABELS/PLACEHOLDERS
  const customLabels = (customization && customization.labels) || {};
  const customPlaceholders = (customization && customization.placeholders) || {};

  const labels = {
    cardholder_name: customLabels.cardholder_name || DEFAULT_LABELS.cardholder_name,
    card_number: customLabels.card_number || DEFAULT_LABELS.card_number,
    cvv: customLabels.cvv || DEFAULT_LABELS.cvv,
    expiration_month: customLabels.expiration_month || DEFAULT_LABELS.expiration_month,
    expiration_year: customLabels.expiration_year || DEFAULT_LABELS.expiration_year,
  };
  const placeholders = {
    cardholder_name: customPlaceholders.cardholder_name || DEFAULT_PLACEHOLDERS.cardholder_name,
    card_number: customPlaceholders.card_number || DEFAULT_PLACEHOLDERS.card_number,
    cvv: customPlaceholders.cvv || DEFAULT_PLACEHOLDERS.cvv,
    expiration_month: customPlaceholders.expiration_month || DEFAULT_PLACEHOLDERS.expiration_month,
    expiration_year: customPlaceholders.expiration_year || DEFAULT_PLACEHOLDERS.expiration_year,
  };

  // Per-field events map
  const eventsByField = {
    card_number: events && events.cardNumberEvents,
    cvv: events && events.cvvEvents,
    expiration_month: events && events.monthEvents,
    expiration_year: events && events.yearEvents,
    cardholder_name: events && events.cardHolderEvents,
  };

  const cardIconOption = {
    enableCardIcon: !(styles && styles.enableCardIcon === false),
  };

  // Normalize fields to object form
  const normalizedFields = (data.fields || []).map(f =>
    typeof f === "string" ? { field: f, container_id: null } : f,
  );

  for (const { field, container_id } of normalizedFields) {
    const fieldStyles = getFieldStyles(field, styles);

    // No label/message for cvv, expiration_month, expiration_year
    const noLabelFields = ["cvv", "expiration_month", "expiration_year"];
    const fieldMessage = noLabelFields.includes(field) ? "" : labels[field];

    const element = await collectContainer.create(
      {
        table: "cards",
        column: field,
        type: typeByField[field],
        validations: validationsByField[field],
        ...fieldStyles,
        label: labels[field],
        placeholder: placeholders[field],
        ...(data.card_id ? { skyflowID: data.card_id } : {}),
      },
      field === "card_number" ? cardIconOption : undefined,
    );

    handleSkyflowElementEvents({
      element,
      fieldMessage,
      errorStyles: fieldStyles.errorTextStyles,
      events: eventsByField[field],
    });

    const containerId =
      container_id || `#collect_${field}` + (data.card_id ? `_${data.card_id}` : "");

    await tryMountElement({ element, containerId });
    mountedElements.push(element);
  }

  return { elements: mountedElements, container: collectContainer };
}

/**
 * Executes a per-field event callback if defined.
 */
function executeEvent(eventName, data, events) {
  if (!events || typeof events[eventName] !== "function") return;
  events[eventName]({
    elementType: (data && data.elementType) || "",
    isEmpty: !!(data && data.isEmpty),
    isFocused: !!(data && data.isFocused),
    isValid: !!(data && data.isValid),
    value: (data && data.value) || "",
  });
}

/**
 * Mounts a Skyflow element to a DOM container, with retry logic.
 * @param {object} params
 * @param {object} params.element
 * @param {string} params.containerId - CSS selector, e.g. '#collect_card_number'
 * @param {number} [params.retries=2]
 * @param {number} [params.delay=30] - Milliseconds between retries.
 */
async function tryMountElement({ element, containerId, retries = 2, delay = 30 }) {
  for (let i = 0; i <= retries; i++) {
    if (document.querySelector(containerId)) {
      element.mount(containerId);
      return;
    }
    if (i < retries) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  console.warn(
    `[mountCardFields] Container ${containerId} not found after ${retries + 1} attempts`,
  );
}

/**
 * Reveals previously tokenized card fields using Skyflow Reveal Elements.
 * CVV is never revealed (PCI DSS req. 3.2.1).
 *
 * @param {object} params
 * @param {object} params.skyflowInstance
 * @param {Record<string, string>} params.tokens - Map of field name → Skyflow token.
 * @param {object} params.request - { fields, styles? }
 * @param {Array<string|{field: string, container_id?: string, altText?: string, label?: string, styles?: object}>} params.request.fields
 * @param {object} [params.request.styles] - Global styles for all reveal elements.
 */
export async function mountRevealFields({ skyflowInstance, tokens, request }) {
  const revealContainer = skyflowInstance.container(Skyflow.ContainerType.REVEAL);

  // Redaction levels are fixed per PCI DSS — not configurable by the caller.
  // CVV (PCI DSS req. 3.2.1) must never be revealed after authorisation.
  const pciRedaction = {
    card_number: "MASKED", // first-6 / last-4 only
    cardholder_name: "PLAIN_TEXT",
    expiration_month: "PLAIN_TEXT",
    expiration_year: "PLAIN_TEXT",
    // cvv intentionally absent — never revealed
  };

  for (const entry of request.fields) {
    const isString = typeof entry === "string";
    const field = isString ? entry : entry.field;

    if (field === "cvv") {
      console.warn("[revealCardFields] CVV cannot be revealed (PCI DSS req. 3.2.1). Skipping.");
      continue;
    }

    const token = tokens[field];
    if (!token) {
      console.warn(`[revealCardFields] No token found for field "${field}", skipping.`);
      continue;
    }

    const cfg = isString ? {} : entry;
    const containerId = cfg.container_id || `#reveal_${field}`;
    const redactionKey = pciRedaction[field];
    const fieldStyles = cfg.styles || {};
    const globalStyles = request.styles || {};

    const element = revealContainer.create({
      token,
      redaction: Skyflow.RedactionType[redactionKey],
      ...(cfg.altText !== undefined ? { altText: cfg.altText } : {}),
      ...(cfg.label !== undefined ? { label: cfg.label } : {}),
      ...(fieldStyles.inputStyles || globalStyles.inputStyles
        ? { inputStyles: fieldStyles.inputStyles || globalStyles.inputStyles }
        : {}),
      ...(fieldStyles.labelStyles || globalStyles.labelStyles
        ? { labelStyles: fieldStyles.labelStyles || globalStyles.labelStyles }
        : {}),
      ...(fieldStyles.errorTextStyles || globalStyles.errorTextStyles
        ? { errorTextStyles: fieldStyles.errorTextStyles || globalStyles.errorTextStyles }
        : {}),
    });

    await tryMountElement({ element, containerId });
  }

  try {
    await revealContainer.reveal();
  } catch (e) {
    // reveal() may return partial success — not critical to throw
    console.warn("[revealCardFields] reveal() completed with errors:", e);
  }
}
