import { InlineCheckout } from "./classes/inlineCheckout";
import { LiteInlineCheckout } from "./classes/LiteInlineCheckout";
import { Maskito } from "@maskito/core";
import { validateCardNumber } from "./helpers/validations";

const customStyles = {
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
    complete: {
      color: "#4caf50",
    },
    empty: {},
    focus: {},
    invalid: {
      border: "1px solid #f44336",
    },
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
  // card: { "skyflow_id": "53ca875c-16fd-4395-8ac9-c756613dbaf9" },
  // metadata: {
  //   order_id: 123456
  // }
};

// localhost
const apiKey = "11e3d3c3e95e0eaabbcae61ebad34ee5f93c3d27";
const returnUrl = "http://127.0.0.1:8080/";
// stage
// const apiKey = "8365683bdc33dd6d50fe2397188d79f1a6765852";

const commonConfig = {
  mode: "stage",
  apiKey,
  returnUrl: returnUrl + "?mode=" + getCheckoutMode(),
  styles: customStyles,
};

let checkout;
let inlineCheckout;
let liteInlineCheckout;

function getCheckoutMode() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("mode") || "inline";
}

function setupInlineCheckout() {
  inlineCheckout = new InlineCheckout({
    ...commonConfig,
    customization: {
      saveCards: {
        showSaveCardOption: false, // Usar para mostrar/ocultar el checkbox de guardar tarjeta para futuros pagos
        autoSave: true,           // Usar para guardar automáticamente la tarjeta (sin necesidad de mostrar el checkbox)
        showSaved: false           // Usar para mostrar/ocultar el listado de tarjetas guardadas
      },
    },
  });
  inlineCheckout.configureCheckout({ customer: checkoutData.customer });
  inlineCheckout.injectCheckout();
  // ['Declined', 'Cancelled', 'Failed', 'Success', 'Pending', 'Authorized']
  inlineCheckout.verify3dsTransaction().then((response) => {
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

function setupLiteInlineCheckout() {
  loadMaskitoMask();
  liteInlineCheckout = new LiteInlineCheckout(commonConfig);
  liteInlineCheckout.configureCheckout({ customer: checkoutData.customer });
  liteInlineCheckout.injectCheckout().then(() => {});
  liteInlineCheckout.verify3dsTransaction().then((response) => {
    console.log("Verify 3ds response", response);
  });

  const liteForm = document.getElementById("lite-payment-form");
  const payButton = document.getElementById("pay-button-lite");
  liteForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const cardData = {
      card_number: document.getElementById("card-number").value,
      cardholder_name: document.getElementById("card-name").value,
      expiration_month: document.getElementById("month").value,
      expiration_year: document.getElementById("year").value,
      cvv: document.getElementById("cvv").value,
    };

    try {
      payButton.textContent = "Procesando...";
      const paymentData = {
        ...checkoutData,
        card: cardData,
      };
      const response = await liteInlineCheckout.payment(paymentData);
      console.log("Respuesta del pago:", response);
      alert("Pago realizado con éxito");
    } catch (error) {
      console.error("Error en el pago:", error);
      alert("Error al realizar el pago");
    } finally {
      payButton.textContent = "Pagar Ahora";
    }
  });
}

function setupCheckout() {
  const mode = getCheckoutMode();
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.style.display = "none";
  });

  if (mode === "inline") {
    document.getElementById("inline-content").style.display = "block";
    setupInlineCheckout();
  } else {
    document.getElementById("lite-content").style.display = "block";
    setupLiteInlineCheckout();
  }
}

function loadMaskitoMask() {
  const cardNumberInput = document.getElementById("card-number");
  const monthInput = document.getElementById("month");
  const yearInput = document.getElementById("year");
  const cvvInput = document.getElementById("cvv");
  const nameInput = document.getElementById("card-name");

  // Definir las opciones para las máscaras
  const cardNumberOptions = {
    mask: [
      ...Array(4).fill(/\d/),
      " ",
      ...Array(4).fill(/\d/),
      " ",
      ...Array(4).fill(/\d/),
      " ",
      ...Array(4).fill(/\d/),
      " ",
      ...Array(3).fill(/\d/),
    ],
  };

  const monthOptions = {
    mask: [/[0-1]/, /\d/],
  };

  const yearOptions = {
    mask: [/\d/, /\d/],
  };

  const nameOptions = {
    mask: /^[a-zA-Z\s]*$/,
  };

  const cvvOptions = {
    mask: [...Array(3).fill(/\d/)],
  };

  // Aplicar Maskito a cada campo
  const cardNumberMask = new Maskito(cardNumberInput, cardNumberOptions);
  const monthMask = new Maskito(monthInput, monthOptions);
  const yearMask = new Maskito(yearInput, yearOptions);
  const cvvMask = new Maskito(cvvInput, cvvOptions);
  const nameMask = new Maskito(nameInput, nameOptions);

  cardNumberInput.addEventListener("input", () => {
    const cardNumber = cardNumberInput.value.replace(/\s+/g, "");
    if (!validateCardNumber(cardNumber)) {
      cardNumberInput.setCustomValidity("Número de tarjeta inválido");
      cardNumberInput.classList.add("invalid");
    } else {
      cardNumberInput.setCustomValidity("");
      cardNumberInput.classList.remove("invalid");
    }
  });

  window.addEventListener("beforeunload", () => {
    cardNumberMask.destroy();
    monthMask.destroy();
    yearMask.destroy();
    cvvMask.destroy();
    nameMask.destroy();
  });
}
function updateActiveTab() {
  const mode = getCheckoutMode();
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active");
  });
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
