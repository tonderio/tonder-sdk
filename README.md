# Tonder SDK

Tonder SDK helps to integrate the services Tonder offers in your own website

## Installation

You can install using NPM
```bash
npm i tonder-sdk-test
```

Add dependencies to the root of the app (index.html)
```html
<script src="https://js.skyflow.com/v1/index.js"></script>
<script src="https://openpay.s3.amazonaws.com/openpay.v1.min.js"></script>
<script src="https://openpay.s3.amazonaws.com/openpay-data.v1.min.js"></script>
```

## Usage
HTML
```html
<div>
    <h1>Checkout</h1>
    <!-- You have to add an entry point with the ID 'tonder-checkout' -->
    <div id="tonder-checkout">
    </div>
</div>
```
## Javascript Example
```javascript
import { InlineCheckout } from "tonder-sdk-test" // Not required if using script tag
```


```javascript
const customStyles = {
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
    firstName: "Juan",
    lastName: "Hernández",
    country: "Mexico",
    address: "Av. Revolución 356, Col. Roma",
    city: "Monterrey",
    state: "Nuevo León",
    postCode: "64700",
    email: "juan.hernandez@mail.com",
    phone: "8187654321",
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
const returnUrl = "http://my-website:8080/checkout"
const successUrl = "http://my-website:8080/sucess"
const inlineCheckout = new InlineCheckout({
  apiKey,
  returnUrl,
  successUrl,
  styles: customStyles
});

inlineCheckout.injectCheckout();

const response = await inlineCheckout.payment(checkoutData);
```

## React Example
```javascript
```

## Configuration
| Property        | Type          | Description                                         |
|:---------------:|:-------------:|:---------------------------------------------------:|
| apiKey          | string        | You can take this from you Tonder Dashboard         |
| backgroundColor | string        | Hex color #000000                                   |

## setPayment params
### products
It will receive an array of objects that represent the products.
```javascript
[
    {
        name: 'name of the product',
        price_unit: 'valid float string with the price of the product',
        quantity: 'valid integer strig with the quantity of this product',
    }
]
```
### shippingCost
It is a valid float string, that will be the shipping cost.

### email
The email of the customer that is making the purchase.
# Tonder inline SDK

## Instalation

You can import InlineCheckout from the instalation, or use a Script tag to import with the following URL
```html
<script src="https://cdn.jsdelivr.net/gh/fuentesc91/react-example-use-tonder-sdk/public/inlinesdk.js" ></script>
```

## Configuration

You only need to initialize the object as the following example

```javascript
    const customer = {
        firstName: "name";
        lastName: "of customer";
        country: "Mexico";
        address: "street address";
        city: "city";
        state: "state";
        postCode: "00000";
        email: "customer@mail.com";
        phone: "9999999999";
    }

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

    const apiKey = "f4ab1f9140ce5b17a1bbd0b62b7f949cdd18967b"; //Your tonder API KEY
    const inlineCheckout = new InlineCheckout({
        apiKey: apiKey,
        customer: ,
        items:
    });
    inlineCheckout.injectCheckout();
```

### apiKey
Your api key getted from Tonder Dashboard

### customer (optional)
The data of the customer to be registered in the transaction

### items
An array of items to be registered in the Tonder order.

### Mount element
You need to have an element where the inline checkout will be mounted, this should be a DIV element with the ID "tonder-checkout"

```html
<div id="tonder-checkout"></div>
```
## License

[MIT](https://choosealicense.com/licenses/mit/)