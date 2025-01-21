export const defaultStyles = {
  inputStyles: {
    base: {
      padding: "10px 7px",
      borderRadius: "5px",
      color: "#000000",
      marginTop: "2px",
      backgroundColor: "#F5F5F5",
      fontFamily: '"Inter", sans-serif',
      fontSize: '14px',
      '&::placeholder': {
        color: "#ccc",
      },
      fontWeight: 400,
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
      '@import': 'url("https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap")',
    }
  },
  labelStyles: {
    base: {
      fontSize: '14px',
      fontWeight: '600',
      fontFamily: '"Inter", sans-serif',
      color: "#333333",
    },
  },
  errorTextStyles: {
    base: {
      fontSize: '14px',
      fontWeight: '500',
      color: "#f44336",
      fontFamily: '"Inter", sans-serif',
    },
  },
  labels: {
    nameLabel: 'Nombre del titular de la tarjeta',
    cardLabel: 'Número de tarjeta',
    cvvLabel: 'CVC/CVV',
    expiryDateLabel: 'Fecha de expiración',
  },
  placeholders: {
    namePlaceholder: 'Nombre del titular de la tarjeta',
    cardPlaceholder: '1234 1234 1234 1234',
    cvvPlaceholder: 'CVV',
    expiryMonthPlaceholder: 'MM',
    expiryYearPlaceholder: 'AA'
  }
}
