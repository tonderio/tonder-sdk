# Tonder SDK

Tonder SDK helps to integrate the services Tonder offers in your own website

## Installation

You can install using NPM
```bash
npm i tonder-web-sdk
```

or using an script tag
```html
<script src="https://zplit-prod.s3.amazonaws.com/v1/bundle.min.js"></script>
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
import { InlineCheckout } from "tonder-web-sdk" // Not required if using script tag
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
    nameLabel: 'Titular de la tarjeta',
    cardLabel: 'Número de tarjeta',
    cvvLabel: 'CVC/CVV',
    expiryDateLabel: 'Fecha de expiración',
  },
  placeholders: {
    namePlaceholder: 'Nombre como aparece en la tarjeta',
    cardPlaceholder: '1234 1234 1234 1234',
    cvvPlaceholder: '3-4 dígitos',
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
  },
  metadata: {
    order_id: 123456
  },
  card: {
    skyflow_id: "12340120349123049",
  }
};

const apiKey = "4c87c36e697e65ddfe288be0afbe7967ea0ab865";
const returnUrl = "http://my-website:8080/checkout"
const successUrl = "http://my-website:8080/success"

// if using script tag, it should be initialized like this
// new TonderSdk.InlineCheckout
const inlineCheckout = new InlineCheckout({
  apiKey,
  returnUrl,
  successUrl,
  styles: customStyles
});

// The configureCheckout function allows you to set initial information, 
// such as the customer's email, which is used to retrieve a list of saved cards.
inlineCheckout.configureCheckout({customer: {email: "example@email.com"}});


inlineCheckout.injectCheckout();

// To verify a 3ds transaction you can use the following method
// It should be called after the injectCheckout method
// The response status will be one of the following
// ['Declined', 'Cancelled', 'Failed', 'Success', 'Pending', 'Authorized']

inlineCheckout.verify3dsTransaction().then(response => {
  console.log('Verify 3ds response', response)
})

const response = await inlineCheckout.payment(checkoutData);
```

## React Example
```javascript
```

## Configuration
| Property        | Type          | Description                                         |
|:---------------:|:-------------:|:---------------------------------------------------:|
| mode            | string        | 'stage' 'production' 'sandbox', default 'stage'     |
| apiKey          | string        | You can take this from you Tonder Dashboard         |
| backgroundColor | string        | Hex color #000000                                   |
| returnUrl       | string        | url where the checkout form is mounted (3ds)         |
| successUrl      | string        |                                                     |
| backgroundColor | string        |                                                     |

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

### apiKey
Your api key getted from Tonder Dashboard

### customer
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