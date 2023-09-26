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

const form = document.querySelector("#payment-form");
const apiKey = "4c87c36e697e65ddfe288be0afbe7967ea0ab865";
const returnUrl = "http://localhost:8080/"
const inlineCheckout = new InlineCheckout({
  form: form,
  apiKey: apiKey,
  totalElementId: "cart-total",
  customer: customer,
  items: items,
  returnUrl: returnUrl
});
inlineCheckout.injectCheckout();
