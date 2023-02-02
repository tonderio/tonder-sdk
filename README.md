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
    apiKey: "f4ab1f9140ce5b17a1bbd0b62b7f949cdd18967b",
    type: "payment",
};
const tonderCheckout = new TonderCheckout(config);

// Update the payment value 
const paymentOptions = {
    productName:"T-shirt",
    productPrice:"399.99",
    productImage:"https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    shippingCost:"150",
}
tonderCheckout.setPayment(paymentOptions)

// Mount the button in the entry point
const buttonOptions = {
    buttonText: 'Proceed to payment'
}

tonderCheckout.mountButton(buttonOptions)
```


## License

[MIT](https://choosealicense.com/licenses/mit/)