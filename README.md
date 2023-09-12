# Tonder SDK

Tonder SDK helps to integrate the services Tonder offers in your own website

## Installation

You can install using NPM
```bash
npm i tonder-sdk-test
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
Javascript

```javascript
import { Checkout } from 'tonder-sdk-test';

// Initialize the checkout
const config = {
    apiKey: "Your Tonder API Key",
    type: "payment",
};
const tonderCheckout = new TonderCheckout(config);

// Update the payment value 
const paymentOptions = {
    email: "customer@email.com"
    products: [
        {
            name:"Product 1",
            price_unit: "399.99",
            image:"https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
            quantity: "1",
            description: "Test",
            
        },
        {
            name:"Product 2",
            price_unit:"599.99",
        },
    ]
    shippingCost:"150",
}
tonderCheckout.setPayment(paymentOptions)

// Mount the button in the entry point
const buttonOptions = {
    buttonText: 'Proceed to payment'
}

tonderCheckout.mountButton(buttonOptions)
```

## React Example
```javascript
import React, { useState, useLayoutEffect, useContext, useEffect } from 'react'
import { Checkout as TonderCheckout } from 'tonder-sdk-test'

import { CartContext } from '../context/CartContext'


export const Checkout = () => {
    const cart = useContext(CartContext)

    const [checkoutResponse, setCheckoutResponse] = useState({})
    const receiveResponse = (data) => {
        setCheckoutResponse(data)
    }
    const config = {
        apiKey: "Your Tonder API Key",
        type: "payment",
        cb: receiveResponse,
    }
    const tonderCheckout = new TonderCheckout(config)
    const params = {
        shippingCost: cart.shippingCost,
        email: "customer@mail.com"
    }
    tonderCheckout.setOrder(params)

    useEffect(()=>{
        function setOrder() {
            const _tonderCart = cart.items.map(product => {
                return {
                    name: product.title,
                    price_unit: product.price,
                    quantity: product.quantity
                }
            })
            tonderCheckout.setOrder({products: _tonderCart})
        }
        setOrder()
    }, [cart.items])

    useLayoutEffect(() => {
        tonderCheckout.mountButton({ buttonText: 'Proceder al pago' })
    })

    return (
        <div>
            <h1>Checkout</h1>
            <div id="tonder-checkout">
            </div>
            <p>{checkoutResponse?.data?.status}</p>
        </div>
    )
}
```

## Configuration
| Property        | Type          | Description                                         |
|:---------------:|:-------------:|:---------------------------------------------------:|
| apiKey          | string        | You can take this from you Tonder Dashboard         |
| type            | string        | values: 'payment', 'lite', 'full'                   |
| backgroundColor | string        | Hex color #000000                                   |
| color           | string        | Hex color #000000                                   |
| cb              | function      | Function executed when checkout send a response     |

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

You only need to initialize the object (or add it in the index.html file of a javascript framework) as the following example

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

    const form = document.querySelector("#payment-form"); // the node form of the checkout process.
    const apiKey = "f4ab1f9140ce5b17a1bbd0b62b7f949cdd18967b"; //Your tonder API KEY
    const inlineCheckout = new InlineCheckout({
    form: form,
    apiKey: apiKey,
    totalElementId: "cart-total", //the ID of the total element where the total is showing.
    customer: ,
    items:
    });
    inlineCheckout.injectCheckout();
```
### form
The form where the checkout is showing, at the end of a successful payment, the sdk will trigger the submit of the form.

### apiKey
Your api key getted from Tonder Dashboard

### totalEmenetId
The ID of the element where the total is showing, the SDK will extract the total.

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