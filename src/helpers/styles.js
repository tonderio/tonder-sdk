export const defaultStyles = {
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
  labels: {
    cardLabel: '',
    cvvLabel: '',
    expiryMonthLabel: '',
    expiryYearLabel: ''
  },
  placeholders: {
    cardPlaceholder: '',
    cvvPlaceholder: '',
    expiryMonthPlaceholder: '',
    expiryYearPlaceholder: ''
  }
}
