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
    minimumFractionDigits: 2
  });
  return formatter.format(value);
}

export function showError(message) {
  var msgErrorDiv = document.getElementById("msgError");
  msgErrorDiv.classList.add("error-container");
  msgErrorDiv.innerHTML = message;
  setTimeout(function () {
    try {
      document.querySelector("#tonderPayButton").disabled = false;
    } catch (error) {}
    msgErrorDiv.classList.remove("error-container");
    msgErrorDiv.innerHTML = "";
  }, 3000);
}

export function showMessage(message, containerId) {
  const msgDiv = document.getElementById(`${containerId}`);
  if(msgDiv) {
    msgDiv.classList.add("message-container");
    msgDiv.innerHTML = message;
    setTimeout(function () {
      msgDiv.classList.remove("message-container");
      msgDiv.innerHTML = "";
    }, 3000);
  }
}
export function getBrowserInfo() {
  const browserInfo = {
    javascript_enabled: true,  // Assumed since JavaScript is running
    time_zone: new Date().getTimezoneOffset(),
    language: navigator.language || 'en-US', // Fallback to 'en-US'
    color_depth: window.screen ? window.screen.colorDepth : null,
    screen_width: window.screen ? window.screen.width * window.devicePixelRatio || window.screen.width : null,
    screen_height: window.screen ? window.screen.height * window.devicePixelRatio || window.screen.height : null,
    user_agent: navigator.userAgent,
  };
  return browserInfo;
}

export const mapCards = (card) => {
  const newCard = { ...card.fields };
  const carArr = newCard.card_number.split("-");
  const last = carArr[carArr.length - 1];
  newCard.card_number = `••••${last}`;
  return newCard;
}

export const getCardType = (scheme) => {
  if(scheme === "Visa") { // Check if visa
    return "https://d35a75syrgujp0.cloudfront.net/cards/visa.png"
  } else if(scheme === "Mastercard") { // Check if master
    return "https://d35a75syrgujp0.cloudfront.net/cards/mastercard.png"
  } else if (scheme === "American Express") { // Check if amex
    return "https://d35a75syrgujp0.cloudfront.net/cards/american_express.png"
  } else {
    return "https://d35a75syrgujp0.cloudfront.net/cards/default_card.png"
  }
}
export const clearSpace = (text) => {
  return text.trim().replace(/\s+/g, '');
}


export function formatPublicErrorResponse(data, error) {
  let code = 200
  try {
    code = Number(error?.code || 200)
  }catch{}

  const default_res = {
    status: "error",
    code,
    message: "",
    detail: error?.body?.detail || error?.body?.error || error.body || "Ocurrio un error inesperado."
  }

  return {
    ...default_res,
    ...data
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
    name: e ? typeof e == "string" ? "catch" : e.name : "Error",
    message: e ? (typeof e == "string" ? e : e.message) : "Error",
    stack: typeof e == "string" ? undefined : e.stack,
  };
}

export function injectMercadoPagoSecurity() {
  try {
      const script = document.createElement('script');
      script.src = "https://www.mercadopago.com/v2/security.js";
      script.setAttribute('view', '');
      script.onload = () => {
          console.log("Mercado Pago script loaded successfully.");
      };
      script.onerror = (error) => {
          console.error("Error loading Mercado Pago script:", error);
      };
      document.head.appendChild(script);
  } catch (error) {
      console.error("Error attempting to inject Mercado Pago script:", error);
  }
}

