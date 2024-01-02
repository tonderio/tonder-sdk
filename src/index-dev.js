import { InlineCheckout } from './classes/inlineCheckout'

const customStyles = {
  inputStyles: {
    base: {
      border: "2px dashed #4a90e2",
      padding: "12px 8px",
      borderRadius: "8px",
      color: "#333333",
      backgroundColor: "#f0f0f0",
      fontFamily: '"Arial", sans-serif',
      fontSize: '14px',
      '&::placeholder': {
        color: "#888888",
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
      fontSize: '14px',
      fontWeight: 'bold',
      fontFamily: '"Inter", sans-serif',
      color: "#4a90e2",
    },
  },
  errorTextStyles: {
    base: {
      fontSize: '12px',
      fontWeight: '500',
      color: "#e74c3c",
      fontFamily: '"Inter", sans-serif',
    },
  },
  labels: {
    cardLabel: 'Número de Tarjeta Personalizado',
    cvvLabel: 'Código de Seguridad',
    expiryMonthLabel: 'Mes de Expiración',
    expiryYearLabel: 'Año de Expiración'
  },
  placeholders: {
    cardPlaceholder: '0000 0000 0000 0000',
    cvvPlaceholder: '123',
    expiryMonthPlaceholder: 'MM',
    expiryYearPlaceholder: 'AA'
  }
}

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
  currency: 'mxn',
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
    ]
  }
};

const apiKey = "4c87c36e697e65ddfe288be0afbe7967ea0ab865";
const returnUrl = "http://localhost:8080/"
const successUrl = "http://localhost:8080/sucess"
const inlineCheckout = new InlineCheckout({
  apiKey,
  returnUrl,
  successUrl,
  styles: customStyles
});

inlineCheckout.injectCheckout();

document.addEventListener('DOMContentLoaded', function() {
  const payButton = document.getElementById('pay-button');
  payButton.addEventListener('click', async function() {
    try {
      const response = await inlineCheckout.payment(checkoutData);
      console.log(response)
      alert('Pago realizado con éxito');
    } catch (error) {
      alert('Error al realizar el pago')
    }
  });
});
