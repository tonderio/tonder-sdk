import { InlineCheckout } from './classes/inlineCheckout'

const customer = {
  firstName: "name",
  lastName: "of customer",
  country: "Mexico",
  address: "street address",
  city: "city",
  state: "state",
  postCode: "00000",
  email: "123123123123123131123@mail.com",
  phone: "9999999999",
};

const items = [
  {
    description: "Example",
    quantity: 1,
    price_unit: 1,
    discount: 0,
    taxes: 0,
    product_reference: 1,
    name: "Producto",
    amount_total: 1,
  },
];

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

const apiKey = "4c87c36e697e65ddfe288be0afbe7967ea0ab865";
const returnUrl = "http://localhost:8080/"
const inlineCheckout = new InlineCheckout({
  apiKey: apiKey,
  customer: customer,
  items: items,
  returnUrl: returnUrl,
  cartTotal: 399,
  styles: customStyles
});

inlineCheckout.injectCheckout();
