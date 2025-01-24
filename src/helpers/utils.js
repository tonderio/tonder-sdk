import { defaultStyles } from "./styles";
import get from "lodash.get";
import { HTML_IDS } from "../shared/constants/htmlTonderIds";

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

export function toCurrency(value) {
  if (isNaN(parseFloat(value))) {
    return value;
  }
  var formatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
  return formatter.format(value);
}

export function showError(
  message,
  selectedId = null,
  containerId = HTML_IDS.msgError,
  containerTextId = HTML_IDS.msgErrorText,
) {
  try {
    const existSelectedId = selectedId && selectedId !== "new";
    let msgErrorDiv = document.getElementById(`${containerId}${existSelectedId ? selectedId : ""}`);
    let msgErrorText = document.getElementById(
      `${containerTextId}${existSelectedId ? selectedId : ""}`,
    );
    msgErrorText.innerHTML = "";
    msgErrorText.innerHTML = message;
    msgErrorDiv.style.display = "flex";

    setTimeout(function () {
      msgErrorDiv.style.display = "none";
      msgErrorText.innerHTML = "";
    }, 3000);
  } catch (error) {
    console.warn("Error showing message error", error);
  }
}

export function showMessage(
  message,
  selectedId = null,
  containerId = HTML_IDS.msgNotification,
  containerTextId = HTML_IDS.msgNotificationText,
) {
  try {
    const existSelectedId = selectedId && selectedId !== "new";
    const msgDiv = document.getElementById(`${containerId}${existSelectedId ? selectedId : ""}`);
    if (msgDiv) {
      let msgText = document.getElementById(
        `${containerTextId}${existSelectedId ? selectedId : ""}`,
      );
      msgDiv.style.display = "flex";
      msgText.innerHTML = "";
      msgText.innerHTML = message;
      setTimeout(function () {
        msgDiv.style.display = "none";
        msgText.innerHTML = "";
      }, 3000);
    }
  } catch (error) {
    console.error("Error showing message", error);
  }
}
export function getBrowserInfo() {
  const browserInfo = {
    javascript_enabled: true, // Assumed since JavaScript is running
    time_zone: new Date().getTimezoneOffset(),
    language: navigator.language || "en-US", // Fallback to 'en-US'
    color_depth: window.screen ? window.screen.colorDepth : null,
    screen_width: window.screen
      ? window.screen.width * window.devicePixelRatio || window.screen.width
      : null,
    screen_height: window.screen
      ? window.screen.height * window.devicePixelRatio || window.screen.height
      : null,
    user_agent: navigator.userAgent,
  };
  return browserInfo;
}

export const mapCards = card => {
  const newCard = { ...card.fields };
  const carArr = newCard.card_number.split("-");
  const last = carArr[carArr.length - 1];
  newCard.card_number = `••••${last}`;
  return newCard;
};

export const getCardType = (scheme, isDark = false) => {
  if (scheme === "Visa") {
    // Check if visa
    return "https://d35a75syrgujp0.cloudfront.net/cards/visa.png";
  } else if (scheme === "Mastercard") {
    // Check if master
    return "https://d35a75syrgujp0.cloudfront.net/cards/mastercard.png";
  } else if (scheme === "American Express") {
    // Check if amex
    return "https://d35a75syrgujp0.cloudfront.net/cards/american_express.png";
  } else {
    return `https://d35a75syrgujp0.cloudfront.net/cards/default_card_tonder${isDark ? "_purple" : ""}.png`;
  }
};
export const clearSpace = text => {
  return text.trim().replace(/\s+/g, "");
};

export function formatPublicErrorResponse(data, error) {
  let code = 200;
  try {
    code = Number(error?.code || 200);
  } catch {}

  const default_res = {
    status: "error",
    code,
    message: "",
    detail:
      error?.body?.detail || error?.body?.error || error.body || "Ocurrio un error inesperado.",
  };

  return {
    ...default_res,
    ...data,
  };
}

export async function buildErrorResponse(response, resJson) {
  let status = response.status.toString();
  let message = resJson.detail || "Error";

  return {
    code: status,
    body: resJson,
    name: status,
    message: message,
    stack: undefined,
  };
}

export function buildErrorResponseFromCatch(e) {
  return {
    code: e?.status ? e.status : e.code,
    body: e?.body,
    name: e ? (typeof e == "string" ? "catch" : e.name) : "Error",
    message: e ? (typeof e == "string" ? e : e.message) : "Error",
    stack: typeof e == "string" ? undefined : e.stack,
  };
}

export function injectMercadoPagoSecurity() {
  try {
    const script = document.createElement("script");
    script.src = "https://www.mercadopago.com/v2/security.js";
    script.setAttribute("view", "");
    script.onload = () => {
      console.log("Mercado Pago script loaded successfully.");
    };
    script.onerror = error => {
      console.error("Error loading Mercado Pago script:", error);
    };
    document.head.appendChild(script);
  } catch (error) {
    console.error("Error attempting to inject Mercado Pago script:", error);
  }
}

export function getCardFormLabels(customStyles) {
  return {
    labels: {
      nameLabel: get(customStyles, "labels.nameLabel", defaultStyles.labels.nameLabel),
      cardLabel: get(customStyles, "labels.cardLabel", defaultStyles.labels.cardLabel),
      cvvLabel: get(customStyles, "labels.cvvLabel", defaultStyles.labels.cvvLabel),
      expiryDateLabel: get(
        customStyles,
        "labels.expiryDateLabel",
        defaultStyles.labels.expiryDateLabel,
      ),
    },
    placeholders: {
      namePlaceholder: get(
        customStyles,
        "placeholders.namePlaceholder",
        defaultStyles.placeholders.namePlaceholder,
      ),
      cardPlaceholder: get(
        customStyles,
        "placeholders.cardPlaceholder",
        defaultStyles.placeholders.cardPlaceholder,
      ),
      cvvPlaceholder: get(
        customStyles,
        "placeholders.cvvPlaceholder",
        defaultStyles.placeholders.cvvPlaceholder,
      ),
      expiryMonthPlaceholder: get(
        customStyles,
        "placeholders.expiryMonthPlaceholder",
        defaultStyles.placeholders.expiryMonthPlaceholder,
      ),
      expiryYearPlaceholder: get(
        customStyles,
        "placeholders.expiryYearPlaceholder",
        defaultStyles.placeholders.expiryYearPlaceholder,
      ),
    },
  };
}

export const executeCallback = async ({ callbacks, callback, data = null, throwError = false }) => {
  try {
    if (callbacks && callback in callbacks) {
      if (data) {
        await callbacks[callback](data);
      } else {
        await callbacks[callback]();
      }
    }
  } catch (e) {
    console.error(e);
    if (throwError) {
      throw e;
    }
  }
};
