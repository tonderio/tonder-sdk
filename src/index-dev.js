import { InlineCheckout } from "./classes/inlineCheckout";
import { LiteInlineCheckout } from "./classes/LiteInlineCheckout";
// ── Shared checkout data ──────────────────────────────────────────────────────

const checkoutData = {
  customer: {
    firstName: "Adrian",
    lastName: "Martinez",
    country: "Mexico",
    address: "Pinos 507, Col El Tecuan",
    city: "Durango",
    state: "Durango",
    postCode: "34105",
    email: "adrian@email.com",
    phone: "8161234567",
  },
  currency: "mxn",
  cart: {
    total: 399,
    items: [
      {
        description: "Black T-Shirt",
        quantity: 1,
        price_unit: 1,
        discount: 0,
        taxes: 0,
        product_reference: 1,
        name: "T-Shirt",
        amount_total: 399,
      },
    ],
  },
  order_reference: "ORD-123456",
};

// localhost
const apiKey = "11e3d3c3e95e0eaabbcae61ebad34ee5f93c3d27";
const apiSecretKey = "197967d431010dc1a129e3f726cb5fd27987da92";
const returnUrl = "http://localhost:8080/";
// stage
// const apiKey = "8365683bdc33dd6d50fe2397188d79f1a6765852";

const BASE_URL_BY_MODE = {
  production: "https://app.tonder.io",
  sandbox: "https://stage.tonder.io",
  stage: "https://stage.tonder.io",
  development: "http://localhost:8000",
};

/**
 * Fetches a short-lived secure token required for card operations (save, list, delete).
 * In production this call should be made server-side to avoid exposing the API key.
 */
async function fetchSecureToken(mode) {
  const baseUrl = BASE_URL_BY_MODE[mode] ?? BASE_URL_BY_MODE.stage;
  const { access } = await fetch(`${baseUrl}/api/secure-token/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiSecretKey}`,
      "Content-Type": "application/json",
    },
  }).then(r => r.json());
  return access;
}

// ── InlineCheckout styles (legacy format, used by InlineCheckout only) ────────

const inlineCustomStyles = {
  inputStyles: {
    base: {
      border: "2px dashed #4a90e2",
      padding: "12px 8px",
      borderRadius: "8px",
      color: "#333333",
      backgroundColor: "#f0f0f0",
      fontFamily: '"Arial", sans-serif',
      fontSize: "14px",
      "&::placeholder": {
        color: "#888888",
      },
    },
    cardIcon: {
      position: "absolute",
      left: "6px",
      bottom: "calc(50% - 12px)",
    },
    complete: { color: "#4caf50" },
    empty: {},
    focus: {},
    invalid: { border: "1px solid #f44336" },
    global: {
      "@import":
        'url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap")',
    },
  },
  labelStyles: {
    base: {
      fontSize: "14px",
      fontWeight: "bold",
      fontFamily: '"Inter", sans-serif',
      color: "#4a90e2",
    },
  },
  errorTextStyles: {
    base: {
      fontSize: "12px",
      fontWeight: "500",
      color: "#e74c3c",
      fontFamily: '"Inter", sans-serif',
    },
  },
  labels: {
    nameLabel: "Nombre de la de Tarjeta",
    cardLabel: "Número de Tarjeta",
    cvvLabel: "Código de Seguridad",
    expiryDateLabel: "Fecha de Expiración",
  },
  placeholders: {
    namePlaceholder: "Nombre como aparece en la tarjeta",
    cardPlaceholder: "0000 0000 0000 0000",
    cvvPlaceholder: "123",
    expiryMonthPlaceholder: "Mes",
    expiryYearPlaceholder: "Año",
  },
};

// ── LiteInlineCheckout customization (new secure-input format) ────────────────

const liteCustomization = {
  styles: {
    // Global card form styles — applied to all fields unless overridden per-field
    cardForm: {
      inputStyles: {
        base: {
          border: "1.5px solid #d0d5dd",
          padding: "10px 14px",
          borderRadius: "8px",
          color: "#1d1d1d",
          backgroundColor: "#fff",
          fontFamily: '"Inter", sans-serif',
          fontSize: "14px",
        },
        focus: {
          borderColor: "#4a90e2",
          boxShadow: "0 0 0 3px rgba(74,144,226,0.15)",
          outline: "none",
        },
        complete: { borderColor: "#27ae60" },
        invalid: { borderColor: "#e74c3c", color: "#c0392b" },
      },
      labelStyles: {
        base: {
          fontSize: "12px",
          fontWeight: "600",
          color: "#344054",
          fontFamily: '"Inter", sans-serif',
          textTransform: "uppercase",
          letterSpacing: "0.4px",
        },
      },
      errorStyles: {
        base: { color: "#e74c3c", fontSize: "11px", marginTop: "3px" },
      },
    },
    // Per-field override example: card_number gets letter-spacing for readability
    cardNumber: {
      inputStyles: {
        base: {
          border: "1.5px solid #d0d5dd",
          padding: "10px 14px",
          borderRadius: "8px",
          color: "#1d1d1d",
          backgroundColor: "#fff",
          fontFamily: '"Inter", sans-serif',
          fontSize: "14px",
        },
        focus: {
          borderColor: "#4a90e2",
          boxShadow: "0 0 0 3px rgba(74,144,226,0.15)",
          outline: "none",
        },
        complete: { borderColor: "#27ae60" },
        invalid: { borderColor: "#e74c3c", color: "#c0392b" },
      },
    },
    // Show the card network icon inside the card number field
    enableCardIcon: true,
  },
  labels: {
    cardholder_name: "Titular de la tarjeta",
    card_number: "Número de tarjeta",
    cvv: "CVV",
    expiration_month: "Mes",
    expiration_year: "Año",
  },
  placeholders: {
    cardholder_name: "Nombre como aparece en la tarjeta",
    card_number: "1234 1234 1234 1234",
    cvv: "3 dígitos",
    expiration_month: "MM",
    expiration_year: "AA",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

let inlineCheckout;
let liteInlineCheckout;

function getCheckoutMode() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("mode") || "inline";
}

// ── InlineCheckout setup ──────────────────────────────────────────────────────

async function setupInlineCheckout() {
  inlineCheckout = new InlineCheckout({
    mode: "stage",
    apiKey,
    returnUrl: returnUrl + "?mode=" + getCheckoutMode(),
    customization: {
      styles: inlineCustomStyles,
      displayMode: "light",
      saveCards: {
        showSaveCardOption: true,
        autoSave: false,
        showSaved: true,
      },
      paymentButton: {
        show: true,
        showAmount: true,
        text: "Pagar",
      },
      cancelButton: {
        show: false,
        text: "Cancelar",
      },
      paymentMethods: { show: true },
      cardForm: { show: true },
    },
    callBack: async response => {
      console.log("Payment response", JSON.stringify(response, null, 2));
      if (response.error) {
        console.log("Payment error", response.error?.details);
        return;
      }
      alert("Payment success");
    },
    callbacks: {
      onCancel: () => console.log("onCancel"),
    },
  });

  const secureToken = await fetchSecureToken("stage");

  inlineCheckout.configureCheckout({
    secureToken,
    ...checkoutData,
  });
  inlineCheckout.injectCheckout();
  inlineCheckout.verify3dsTransaction().then(response => {
    console.log("Verify 3ds response", response);
  });

  const payButton = document.getElementById("pay-button");
  payButton.addEventListener("click", async function () {
    try {
      payButton.textContent = "Procesando...";
      const response = await inlineCheckout.payment(checkoutData);
      console.log("Respuesta del pago:", response);
      alert("Pago realizado con éxito");
    } catch (error) {
      console.log("Error en el pago:", error.details);
      alert("Error al realizar el pago");
    } finally {
      payButton.textContent = "Pagar";
    }
  });
}

// ── LiteInlineCheckout setup ──────────────────────────────────────────────────

// Styles for Skyflow reveal elements rendered inside the credit card visual.
// Text must be white and background transparent to blend with the card gradient.
const REVEAL_STYLES = {
  number: {
    inputStyles: {
      base: {
        color: "#fff",
        fontSize: "15px",
        fontFamily: '"Courier New", "Courier", monospace',
        letterSpacing: "2px",
        fontWeight: "700",
        background: "transparent",
        border: "none",
        padding: "0",
        lineHeight: "26px",
      },
    },
  },
  name: {
    inputStyles: {
      base: {
        color: "rgba(255,255,255,0.9)",
        fontSize: "11px",
        fontFamily: '"Inter", sans-serif',
        letterSpacing: "1px",
        textTransform: "uppercase",
        fontWeight: "500",
        background: "transparent",
        border: "none",
        padding: "0",
        lineHeight: "20px",
      },
    },
  },
  expiry: {
    inputStyles: {
      base: {
        color: "rgba(255,255,255,0.85)",
        fontSize: "11px",
        fontFamily: '"Inter", sans-serif',
        letterSpacing: "0.5px",
        fontWeight: "500",
        background: "transparent",
        border: "none",
        padding: "0",
        lineHeight: "20px",
      },
    },
  },
};

async function setupLiteInlineCheckout() {
  const payButton = document.getElementById("pay-button-lite");

  liteInlineCheckout = new LiteInlineCheckout({
    mode: "stage",
    apiKey,
    returnUrl: returnUrl + "?mode=" + getCheckoutMode(),
    // customization: liteCustomization,
    events: {
      cardNumberEvents: {
        onChange: ({ isValid, isEmpty }) => {
          console.log("[card_number] onChange — isValid:", isValid, "isEmpty:", isEmpty);
        },
      },
      cvvEvents: {
        onBlur: ({ isValid }) => {
          console.log("[cvv] onBlur — isValid:", isValid);
        },
      },
    },
  });

  const secureToken = await fetchSecureToken("stage");

  liteInlineCheckout.configureCheckout({
    secureToken,
    customer: checkoutData.customer,
  });

  // Initialize merchant data (vault credentials, etc.)
  await liteInlineCheckout.injectCheckout();

  // Log saved cards for reference
  liteInlineCheckout.getCustomerCards().then(r => {
    console.log("Customer cards:", r);
  });

  // Mount all five secure Skyflow iframe fields into their containers.
  // The default container IDs are #collect_<field> — matching the divs in index.html.
  await liteInlineCheckout.mountCardFields({
    fields: ["cardholder_name", "card_number", "expiration_month", "expiration_year", "cvv"],
  });

  liteInlineCheckout.verify3dsTransaction().then(response => {
    console.log("Verify 3ds response", response);
  });

  // Reveals tokenized card data inside the credit card visual after save.
  async function showSavedCard() {
    document.getElementById("card-form-wrapper").style.display = "none";
    document.getElementById("card-result").style.display = "block";

    await liteInlineCheckout.revealCardFields({
      fields: [
        {
          field: "card_number",
          container_id: "#reveal_card_number",
          altText: "•••• •••• •••• ••••",
          styles: REVEAL_STYLES.number,
        },
        {
          field: "cardholder_name",
          container_id: "#reveal_cardholder_name",
          altText: "Nombre del titular",
          styles: REVEAL_STYLES.name,
        },
        {
          field: "expiration_month",
          container_id: "#reveal_expiry_month",
          altText: "MM",
          styles: REVEAL_STYLES.expiry,
        },
        {
          field: "expiration_year",
          container_id: "#reveal_expiry_year",
          altText: "AA",
          styles: REVEAL_STYLES.expiry,
        },
      ],
    });
  }

  // Pay → save card → reveal card UI
  payButton.addEventListener("click", async function () {
    try {
      payButton.disabled = true;
      payButton.textContent = "Procesando pago...";

      await liteInlineCheckout.payment({ ...checkoutData });
      console.log("Payment successful");

      payButton.textContent = "Guardando tarjeta...";
      await liteInlineCheckout.saveCustomerCard();
      console.log("Card saved");

      await showSavedCard();
    } catch (error) {
      console.error("Error:", error);
      alert("Error: " + (error?.message || "Error al procesar el pago"));
    } finally {
      payButton.disabled = false;
      payButton.textContent = "Pagar Ahora";
    }
  });

  // "New payment" — return to the form
  document.getElementById("new-payment-btn").addEventListener("click", function () {
    document.getElementById("card-result").style.display = "none";
    document.getElementById("card-form-wrapper").style.display = "block";
  });
}

// ── Enrollment setup (save card + reveal, no payment redirect) ────────────────

let enrollmentCheckout;

async function setupEnrollmentCheckout() {
  const saveBtn = document.getElementById("save-card-btn");

  enrollmentCheckout = new LiteInlineCheckout({
    mode: "stage",
    apiKey,
    returnUrl: returnUrl + "?mode=enrollment",
    customization: liteCustomization,
  });

  const secureToken = await fetchSecureToken("stage");

  enrollmentCheckout.configureCheckout({
    secureToken,
    customer: checkoutData.customer,
  });

  await enrollmentCheckout.injectCheckout();

  await enrollmentCheckout.mountCardFields({
    fields: [
      { field: "cardholder_name", container_id: "#enroll_cardholder_name" },
      { field: "card_number", container_id: "#enroll_card_number" },
      { field: "expiration_month", container_id: "#enroll_expiration_month" },
      { field: "expiration_year", container_id: "#enroll_expiration_year" },
      { field: "cvv", container_id: "#enroll_cvv" },
    ],
  });

  async function showEnrolledCard() {
    document.getElementById("enroll-form-wrapper").style.display = "none";
    document.getElementById("enroll-card-result").style.display = "block";

    await enrollmentCheckout.revealCardFields({
      fields: [
        {
          field: "card_number",
          container_id: "#enroll_reveal_card_number",
          altText: "•••• •••• •••• ••••",
          styles: REVEAL_STYLES.number,
        },
        {
          field: "cardholder_name",
          container_id: "#enroll_reveal_cardholder_name",
          altText: "Nombre del titular",
          styles: REVEAL_STYLES.name,
        },
        {
          field: "expiration_month",
          container_id: "#enroll_reveal_expiry_month",
          altText: "MM",
          styles: REVEAL_STYLES.expiry,
        },
        {
          field: "expiration_year",
          container_id: "#enroll_reveal_expiry_year",
          altText: "AA",
          styles: REVEAL_STYLES.expiry,
        },
      ],
    });
  }

  saveBtn.addEventListener("click", async function () {
    try {
      saveBtn.disabled = true;
      saveBtn.textContent = "Guardando...";

      await enrollmentCheckout.saveCustomerCard();
      console.log("Card saved");

      await showEnrolledCard();
    } catch (error) {
      console.error("Error al guardar tarjeta:", error);
      alert("Error: " + (error?.message || "No se pudo guardar la tarjeta"));
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar tarjeta";
    }
  });

  document.getElementById("new-enrollment-btn").addEventListener("click", function () {
    document.getElementById("enroll-card-result").style.display = "none";
    document.getElementById("enroll-form-wrapper").style.display = "block";
  });
}

// ── Tab routing ───────────────────────────────────────────────────────────────

function setupCheckout() {
  const mode = getCheckoutMode();
  document.querySelectorAll(".tab-content").forEach(content => {
    content.style.display = "none";
  });

  if (mode === "inline") {
    document.getElementById("inline-content").style.display = "block";
    setupInlineCheckout();
  } else if (mode === "enrollment") {
    document.getElementById("enrollment-content").style.display = "block";
    setupEnrollmentCheckout();
  } else {
    document.getElementById("lite-content").style.display = "block";
    setupLiteInlineCheckout();
  }
}

function updateActiveTab() {
  const mode = getCheckoutMode();
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  document.querySelector(`[data-mode="${mode}"]`).classList.add("active");
}

function switchTab(mode) {
  window.location.href = `${window.location.pathname}?mode=${mode}`;
}

document.addEventListener("DOMContentLoaded", function () {
  setupCheckout();
  updateActiveTab();
});

window.switchTab = switchTab;
