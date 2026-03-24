// Generic field-keyed label/placeholder defaults — shared by InlineCheckout and LiteInlineCheckout
export const DEFAULT_LABELS = {
  cardholder_name: "Nombre del titular de la tarjeta",
  card_number: "Número de tarjeta",
  cvv: "CVC/CVV",
  expiration_month: "Mes",
  expiration_year: "Año",
};

export const DEFAULT_PLACEHOLDERS = {
  cardholder_name: "Nombre del titular de la tarjeta",
  card_number: "1234 1234 1234 1234",
  cvv: "CVV",
  expiration_month: "MM",
  expiration_year: "AA",
};

export const defaultStyles = {
  inputStyles: {
    base: {
      padding: "10px 7px",
      borderRadius: "5px",
      color: "#000000",
      marginTop: "2px",
      backgroundColor: "#F5F5F5",
      fontFamily: '"Inter", sans-serif',
      fontSize: "14px",
      "&::placeholder": {
        color: "#ccc",
      },
      fontWeight: 400,
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
        'url("https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap")',
    },
  },
  labelStyles: {
    base: {
      fontSize: "14px",
      fontWeight: "600",
      fontFamily: '"Inter", sans-serif',
      color: "#333333",
      textAlign: "start",
    },
  },
  errorTextStyles: {
    base: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#f44336",
      fontFamily: '"Inter", sans-serif',
    },
  },
  labels: {
    nameLabel: DEFAULT_LABELS.cardholder_name,
    cardLabel: DEFAULT_LABELS.card_number,
    cvvLabel: DEFAULT_LABELS.cvv,
    expiryDateLabel: "Fecha de expiración",
  },
  placeholders: {
    namePlaceholder: DEFAULT_PLACEHOLDERS.cardholder_name,
    cardPlaceholder: DEFAULT_PLACEHOLDERS.card_number,
    cvvPlaceholder: DEFAULT_PLACEHOLDERS.cvv,
    expiryMonthPlaceholder: DEFAULT_PLACEHOLDERS.expiration_month,
    expiryYearPlaceholder: DEFAULT_PLACEHOLDERS.expiration_year,
  },
};

export const getDefaultStyles = isDark => {
  const darkBaseInputStyles = {
    backgroundColor: "#5C5C5C",
    color: "#FFFFFF",
    "&::placeholder": {
      color: "#AAAAAA",
    },
  };

  const darkBaseLabelStyles = {
    color: "#FFFFFF",
  };

  return {
    ...defaultStyles,
    inputStyles: {
      ...defaultStyles.inputStyles,
      base: { ...defaultStyles.inputStyles.base, ...(isDark ? { ...darkBaseInputStyles } : {}) },
    },
    labelStyles: {
      ...defaultStyles.labelStyles,
      base: { ...defaultStyles.labelStyles.base, ...(isDark ? { ...darkBaseLabelStyles } : {}) },
    },
  };
};
