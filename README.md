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
    apiKey: "businessAPIKey",
    type: "payment",
};
const tonderCheckout = new TonderCheckout(config);

// Update the payment value 
const paymentOptions = {
    email: "customer@email.com"
    products: [
        {
            name:"Product 1",
            price:"399.99",
            image:"https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        },
        {
            name:"Product 2",
            price:"599.99",
            image:"https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
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

## Configuration
| Property        | Type          | Description                                         |
|:---------------:|:-------------:|:---------------------------------------------------:|
| apiKey          | string        | You can take this from you Tonder Dashboard         |
| type            | string        | values: 'payment', 'lite', 'full'                   |
| backgroundColor | string        | Hex color #000000                                   |
| color           | string        | Hex color #000000                                   |

## setPayment params
### products
It will receive an array of objects that represent the products.
```javascript
[
    {
        name: 'name of the product',
        price: 'price of the product',
        image: 'url to the image to be used'
    }
]
```
### shippingCost
It is a valid float string, that will be the shipping cost.

### email
The email of the customer that is making the purchase.
## License

[MIT](https://choosealicense.com/licenses/mit/)