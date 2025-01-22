# Tonder SDK

Tonder SDK helps to integrate the services Tonder offers in your own website

## Table of Contents

1. [Installation](#installation)
2. [Usage](#usage)
   - [InlineCheckout](#inlinecheckout)
   - [LiteCheckout](#litecheckout)
3. [Configuration Options](#configuration-options)
4. [Styling InlineCheckout](#styling-inlinecheckout)
5. [Payment Data Structure](#payment-data-structure)
6. [Field Validation Functions](#field-validation-functions)
7. [API Reference](#api-reference)
8. [Examples](#examples)
9. [License](#license)

## Installation

You can install the Tonder SDK using NPM or by including it via a script tag.

### NPM Installation

```bash
npm i tonder-web-sdk
```

### Script Tag Installation

```html
<script src="https://zplit-prod.s3.amazonaws.com/v1/bundle.min.js"></script>
```

### Dependencies

Add dependencies to the root of the app (index.html)

```html
<script src="https://js.skyflow.com/v1/index.js"></script>
<script src="https://openpay.s3.amazonaws.com/openpay.v1.min.js"></script>
<script src="https://openpay.s3.amazonaws.com/openpay-data.v1.min.js"></script>
```

## Usage

### InlineCheckout

InlineCheckout provides a pre-built, customizable checkout interface.

#### HTML Setup

You need to have an element where the inline checkout will be mounted. This should be a DIV element with the ID "tonder-checkout":

```html
<div>
  <h1>Checkout</h1>
  <div id="tonder-checkout"></div>
</div>
```

#### JavaScript Implementation

```javascript
import { InlineCheckout } from "tonder-web-sdk"; // Not required if using script tag
```

```javascript
// if using script tag, it should be initialized like this
// new TonderSdk.InlineCheckout
const inlineCheckout = new InlineCheckout({
  apiKey: "your-api-key",
  returnUrl: "https://your-website.com/checkout",
  styles: customStyles, // Optional, see Styling section
});

// The configureCheckout function allows you to set initial information,
// such as the customer's email, which is used to retrieve a list of saved cards.
inlineCheckout.configureCheckout({ customer: { email: "example@email.com" } });

// Inject the checkout into the DOM
inlineCheckout.injectCheckout();

// To verify a 3ds transaction you can use the following method
// It should be called after the injectCheckout method
// The response status will be one of the following
// ['Declined', 'Cancelled', 'Failed', 'Success', 'Pending', 'Authorized']

inlineCheckout.verify3dsTransaction().then((response) => {
  console.log("Verify 3ds response", response);
});
```

```javascript
// Process a payment
const response = await inlineCheckout.payment(checkoutData);
```

### LiteCheckout

LiteCheckout allows you to build a custom checkout interface using Tonder's core functionality.

```javascript
import { LiteCheckout } from "tonder-web-sdk";
```

```javascript
const liteCheckout = new LiteCheckout({
  apiKey: "your-api-key", // Your api key getted from Tonder Dashboard
  returnUrl: "http://your-website.com/checkout",
});

// The configureCheckout function allows you to set initial information,
// such as the customer's email, which is used to retrieve a list of saved cards.
inlineCheckout.configureCheckout({ customer: { email: "example@email.com" } });

// Initialize the checkout
await liteCheckout.injectCheckout();
```

```javascript
// Retrieve customer's saved cards
const cards = await liteCheckout.getCustomerCards();
```

```javascript
// Save a new card
const newCard = await liteCheckout.saveCustomerCard(cardData);
```

```javascript
// Remove a saved card
await liteCheckout.removeCustomerCard(cardId);
```

```javascript
// Get available payment methods
const paymentMethods = await liteCheckout.getCustomerPaymentMethods();
```

```javascript
// Process a payment
const paymentResponse = await liteCheckout.payment(paymentData);
```

```javascript
// Verify a 3DS transaction
const verificationResult = await liteCheckout.verify3dsTransaction();
```

## Configuration Options

Both InlineCheckout and LiteCheckout accept the following configuration options:

|                  Property                  |  Type   | Default                                                                     |                                  Description                                  |
|:------------------------------------------:|:-------:|-----------------------------------------------------------------------------|:-----------------------------------------------------------------------------:|
|                    mode                    | string  | stage                                                                       | Environment mode. Options: 'stage', 'production', 'sandbox'. Default: 'stage' |
|                   apiKey                   | string  |                                                                             |                    Your API key from the Tonder Dashboard                     |
|                 returnUrl                  | string  |                                                                             |             URL where the checkout form is mounted (used for 3DS)             |
|                   styles                   | object  |                                                                             |        (InlineCheckout only) Custom styles for the checkout interface         |
|               customization                | object  | `{saveCards: {showSaved: true, showSaveCardOption: true, autoSave: false}}` |               Object to customize the checkout behavior and UI.               |
|     customization.saveCards.showSaved      | boolean | true                                                                        |                     Show saved cards in the checkout UI.                      |
| customization.saveCards.showSaveCardOption | boolean | true                                                                        |             Show the option to save the card for future payments.             |
|      customization.saveCards.autoSave      | boolean | false                                                                       |      Automatically save the card without showing the option to the user.      |
|             **paymentButton**              |     
|             paymentButton.show             | boolean | true                                                                        |                 Controls the visibility of the payment button                 |
|             paymentButton.text             | string  | 'Pagar'                                                                     |                 Custom text to display on the payment button                  |
|          paymentButton.showAmount          | boolean | true                                                                        |           Shows the payment amount on the button (e.g., "Pay $100")           |                                     |         |                                                                                                                                             |

## Styling InlineCheckout

You can customize the appearance of InlineCheckout by passing a `styles` object:

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
      fontSize: "16px",
      "&::placeholder": {
        color: "#ccc",
      },
    },
    cardIcon: {
      position: "absolute",
      left: "6px",
      bottom: "calc(50% - 12px)",
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
      "@import":
        'url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap")',
    },
  },
  labelStyles: {
    base: {
      fontSize: "12px",
      fontWeight: "500",
      fontFamily: '"Inter", sans-serif',
    },
  },
  errorTextStyles: {
    base: {
      fontSize: "12px",
      fontWeight: "500",
      color: "#f44336",
      fontFamily: '"Inter", sans-serif',
    },
  },
  labels: {
    nameLabel: "Card Holder Name",
    cardLabel: "Card Number",
    cvvLabel: "CVC/CVV",
    expiryDateLabel: "Expiration Date",
  },
  placeholders: {
    namePlaceholder: "Name as it appears on the card",
    cardPlaceholder: "1234 1234 1234 1234",
    cvvPlaceholder: "3-4 digits",
    expiryMonthPlaceholder: "MM",
    expiryYearPlaceholder: "YY",
  },
};
```

## Payment Data Structure

When calling the `payment` method, use the following data structure:

### Field Descriptions

- **customer**: Object containing the customer's personal information to be registered in the transaction.

- **cart**: Object containing the total amount and an array of items to be registered in the Tonder order.

  - **total**: The total amount of the transaction.
  - **items**: An array of objects, each representing a product or service in the order.
    - name: name of the product
    - price_unit: valid float string with the price of the product
    - quantity: valid integer string with the quantity of this product

- **currency**: String representing the currency code for the transaction (e.g., "MXN" for Mexican Peso).

- **metadata**: Object for including any additional information about the transaction. This can be used for internal references or tracking.

- **card**: (for LiteCheckout) Object containing card information. This is used differently depending on whether it's a new card or a saved card:

  - For a new card: Include `card_number`, `cvv`, `expiration_month`, `expiration_year`, and `cardholder_name`.
  - For a saved card: Include only the `skyflow_id` of the saved card.
  - This is only used when not paying with a payment_method.

- **payment_method**: (for LiteCheckout) String indicating the alternative payment method to be used (e.g., "Spei"). This is only used when not paying with a card.

Note: The exact fields required may vary depending on whether you're using InlineCheckout or LiteCheckout, and the specific payment method being used.

```javascript
const paymentData = {
  customer: {
    firstName: "John",
    lastName: "Doe",
    country: "USA",
    address: "123 Main St",
    city: "Anytown",
    state: "CA",
    postCode: "12345",
    email: "john.doe@example.com",
    phone: "1234567890",
  },
  cart: {
    total: "100.00",
    items: [
      {
        description: "Product description",
        quantity: 1,
        price_unit: "100.00",
        discount: "0.00",
        taxes: "0.00",
        product_reference: "PROD123",
        name: "Product Name",
        amount_total: "100.00",
      },
    ],
  },
  currency: "MXN",
  metadata: {
    order_id: "ORDER123",
  },
  // For Lite checkout
  card: {
    // For a new card:
    card_number: "4111111111111111",
    cvv: "123",
    expiration_month: "12",
    expiration_year: "25",
    cardholder_name: "John Doe",
    // Or for a saved card:
    skyflow_id: "saved-card-id",
  },
  // For Lite checkout
  payment_method: "Spei",
};
```

## Field Validation Functions

For LiteCheckout implementations, the SDK provides validation functions to ensure the integrity of card data before submitting:

- `validateCardNumber(cardNumber)`: Validates the card number using the Luhn algorithm.
- `validateCardholderName(name)`: Checks if the cardholder name is valid.
- `validateCVV(cvv)`: Ensures the CVV is in the correct format.
- `validateExpirationDate(expirationDate)`: Validates the expiration date in MM/YY format.
- `validateExpirationMonth(month)`: Checks if the expiration month is valid.
- `validateExpirationYear(year)`: Validates the expiration year.

Example usage:

```javascript
import {
  validateCardNumber,
  validateCardholderName,
  validateCVV,
  validateExpirationDate,
} from "tonder-web-sdk";

const cardNumber = "4111111111111111";
const cardholderName = "John Doe";
const cvv = "123";
const expirationDate = "12/25";

if (
  validateCardNumber(cardNumber) &&
  validateCardholderName(cardholderName) &&
  validateCVV(cvv) &&
  validateExpirationDate(expirationDate)
) {
  // Proceed with payment
} else {
  // Show error message
}
```

## API Reference

### InlineCheckout Methods

- `configureCheckout(data)`: Set initial checkout data
- `injectCheckout()`: Inject the checkout interface into the DOM
- `payment(data)`: Process a payment
- `verify3dsTransaction()`: Verify a 3DS transaction

### LiteCheckout Methods

- `configureCheckout(data)`: Set initial checkout data
- `injectCheckout()`: Initialize the checkout
- `getCustomerCards()`: Retrieve saved cards
- `saveCustomerCard(cardData)`: Save a new card
- `removeCustomerCard(cardId)`: Remove a saved card
- `getCustomerPaymentMethods()`: Get available payment methods
- `payment(data)`: Process a payment
- `verify3dsTransaction()`: Verify a 3DS transaction

## Examples

Here are examples of how to implement Tonder SDK in various JavaScript frameworks:

### Vanilla JavaScript

#### HTML Setup

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tonder Checkout Example</title>
    <script src="https://js.skyflow.com/v1/index.js"></script>
    <script src="https://openpay.s3.amazonaws.com/openpay.v1.min.js"></script>
    <script src="https://openpay.s3.amazonaws.com/openpay-data.v1.min.js"></script>
    <!-- Only if not use npm package   -->
    <script src="https://zplit-prod.s3.amazonaws.com/v1/bundle.min.js"></script>
  </head>
  <body>
    <div id="tonder-checkout"></div>
    <button id="pay-button">Pay Now</button>

    <script src="your-script.js"></script>
  </body>
</html>
```

#### InlineCheckout Example (your-script.js)

```javascript
import { InlineCheckout } from "tonder-web-sdk";

const apiKey = "your-api-key";
const returnUrl = "http://your-website.com/checkout";

const inlineCheckout = new InlineCheckout({
  mode: "development",
  apiKey,
  returnUrl,
  styles: customStyles, // Define your custom styles here
});

inlineCheckout.configureCheckout({ customer: { email: "example@email.com" } });
inlineCheckout.injectCheckout();

inlineCheckout.verify3dsTransaction().then((response) => {
  console.log("Verify 3ds response", response);
});

document
  .getElementById("pay-button")
  .addEventListener("click", async function () {
    try {
      const response = await inlineCheckout.payment(checkoutData);
      console.log("Payment response:", response);
      alert("Payment successful");
    } catch (error) {
      console.error("Payment error:", error.details);
      alert("Payment failed");
    }
  });
```


#### InlineCheckout with default Tonder Payment button Example (your-script.js)
> 💡 **Note:** It is important to send all payment data (customer, cart, metadata, etc) when configuring the checkout; this is necessary when using Tonder's default payment button.

```javascript
import { InlineCheckout } from "tonder-web-sdk";

const apiKey = "your-api-key";
const returnUrl = "http://your-website.com/checkout";

const inlineCheckout = new InlineCheckout({
  mode: "development",
  apiKey,
  returnUrl,
  styles: customStyles,
  customization: {
    paymentButton: {
      show: true
    }
  }, // activate default Tonder Payment button
  callBack: (response) => {
      console.log('Payment response', response)
  }  
});

// It is important to send all payment data (customer, cart, metadata, etc) when configuring the checkout; this is necessary when using Tonder's default payment button.
inlineCheckout.configureCheckout(
    { 
        customer: { email: "example@email.com" },
        currency: "mxn",
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
            ],
        },
        metadata: {}, // Optional
        order_reference: "" // Optional
    }
);
inlineCheckout.injectCheckout();

inlineCheckout.verify3dsTransaction().then((response) => {
  console.log("Verify 3ds response", response);
});
```


#### LiteCheckout Example (your-script.js)

```javascript
import { LiteInlineCheckout } from "tonder-web-sdk";

const apiKey = "your-api-key";
const returnUrl = "http://your-website.com/checkout";

const liteCheckout = new LiteInlineCheckout({
  mode: "development",
  apiKey,
  returnUrl,
});

liteCheckout.configureCheckout({ customer: { email: "example@email.com" } });
liteCheckout.injectCheckout();

liteCheckout.verify3dsTransaction().then((response) => {
  console.log("Verify 3ds response", response);
});

document
  .getElementById("lite-payment-form")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    const cardData = {
      card_number: document.getElementById("card-number").value,
      cardholder_name: document.getElementById("card-name").value,
      expiration_month: document.getElementById("month").value,
      expiration_year: document.getElementById("year").value,
      cvv: document.getElementById("cvv").value,
    };

    try {
      const paymentData = { ...checkoutData, card: cardData };
      const response = await liteCheckout.payment(paymentData);
      console.log("Payment response:", response);
      alert("Payment successful");
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed");
    }
  });
```

### React or Nextjs

For React or Nextjs applications, we recommend using a context provider to manage the Tonder instance across your application.

First, create a TonderProvider:

```jsx
// TonderProvider.jsx
"use client"; // only for Nextjs
import React, { createContext, useContext, useState, useEffect } from "react";
import { InlineCheckout } from "tonder-web-sdk";

const TonderContext = createContext();

export const useTonder = () => useContext(TonderContext);

export const TonderProvider = ({ children }) => {
  const [tonderInstance, setTonderInstance] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const inlineCheckout = new InlineCheckout({
          mode: "development",
          apiKey: "your-api-key",
          returnUrl: "http://your-website.com/checkout",
        });
        setTonderInstance(inlineCheckout);
      } catch (error) {
        console.error("Error initializing Tonder:", error);
      }
    };

    init();
  }, []);

  return (
    <TonderContext.Provider value={tonderInstance}>
      {children}
    </TonderContext.Provider>
  );
};
```

Then, create a TonderCheckout component:

```jsx
// TonderCheckout.jsx
"use client"; // only for Nextjs
import React, { useEffect, useState } from "react";
import { useTonder } from "./TonderProvider";

const TonderCheckout = () => {
  const tonder = useTonder();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tonder) return;

    tonder.configureCheckout({ customer: { email: "example@email.com" } });
    tonder.injectCheckout();

    tonder.verify3dsTransaction().then((response) => {
      console.log("Verify 3ds response", response);
    });

    return () => {
      if (tonder.removeCheckout) {
        tonder.removeCheckout();
      }
    };
  }, [tonder]);

  const handlePayment = async () => {
    if (!tonder) return;
    setLoading(true);
    try {
      const response = await tonder.payment(paymentData);
      console.log("Payment successful:", response);
      alert("Payment successful");
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div id="tonder-checkout"></div>
      <button onClick={handlePayment} disabled={loading}>
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
};

export default TonderCheckout;
```

Finally, use it in your checkout component:

```jsx
"use client";
import { useEffect, useState } from "react";
import { useTonder, TonderProvider } from "./TonderProvider";
import Script from "next/script";

export default function TonderCheckout() {
  return (
    <div id="checkout">
      {/*Provider*/}
      <TonderProvider>
        <CheckoutContent />
      </TonderProvider>
    </div>
  );
}

function CheckoutContent() {
  const tonder = useTonder();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tonder) return;
    tonder.configureCheckout({ customer: { email: "example@email.com" } });
    tonder.injectCheckout();
    tonder.verify3dsTransaction().then((response) => {
      console.log("Verify 3ds response", response);
    });
    return () => {
      if (tonder.removeCheckout) {
        tonder.removeCheckout();
      }
    };
  }, [tonder]);

  const handlePayment = async () => {
    if (!tonder) return;
    setLoading(true);
    try {
      const response = await tonder.payment(paymentData);
      console.log(response);
      alert("Payment successful");
    } catch (error) {
      console.error(error);
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div id="tonder-checkout"></div>
      <button onClick={handlePayment} disabled={loading}>
        {loading ? "Processing..." : "Pay"}
      </button>
    </div>
  );
}
```

### Angular

For Angular, we recommend using a service to manage the Tonder instance:

```typescript
// tonder.service.ts
import { Injectable } from "@angular/core";
import { InlineCheckout } from "tonder-web-sdk";

@Injectable({
  providedIn: "root",
})
export class TonderService {
  private inlineCheckout: InlineCheckout;

  constructor(private sdkParameters: IInlineCheckoutOptions) {
    this.initializeInlineCheckout();
  }

  private initializeInlineCheckout(): void {
    this.inlineCheckout = new InlineCheckout({ ...this.sdkParameters });
  }

  configureCheckout(customerData: IConfigureCheckout): void {
    this.inlineCheckout.configureCheckout({ ...customerData });
  }

  async injectCheckout(): Promise<void> {
    await this.inlineCheckout.injectCheckout();
  }

  verify3dsTransaction(): Promise<ITransaction | void> {
    return this.inlineCheckout.verify3dsTransaction();
  }

  // Add more functions, for example for lite sdk: get payment methods

  // getCustomerPaymentMethods(): Promise<IPaymentMethod[]> {
  //     return this.liteCheckout.getCustomerPaymentMethods();
  // }
}

// checkout.component.ts
import { Component, OnInit, OnDestroy } from "@angular/core";
import { TonderService } from "./tonder.service";

@Component({
  selector: "app-tonder-checkout",
  template: `
    <div id="tonder-checkout"></div>
    <button (click)="pay()" [disabled]="loading">
      {{ loading ? "Processing..." : "Pay" }}
    </button>
  `,
  providers: [
    {
      provide: TonderInlineService,
      // Inicialización del SDK de Tonder Inline
      // Nota: Reemplace estas credenciales con las suyas propias en desarrollo/producción
      useFactory: () =>
        new TonderInlineService({
          apiKey: "11e3d3c3e95e0eaabbcae61ebad34ee5f93c3d27",
          returnUrl: "http://localhost:4200/checkout/payment?tabPayment=0",
          mode: "development",
        }),
    },
  ],
})
export class TonderCheckoutComponent implements OnInit, OnDestroy {
  loading = false;

  constructor(private tonderService: TonderService) {}

  ngOnInit() {
    this.initCheckout();
  }

  ngOnDestroy() {
    // Limpieza del checkout al destruir el componente
    this.tonderService.removeCheckout();
  }

  async initCheckout() {
    this.tonderService.configureCheckout({
      customer: { email: "example@email.com" },
    });
    await this.tonderService.injectCheckout();
    this.tonderService.verify3dsTransaction().then((response) => {
      console.log("Verify 3ds response", response);
    });
  }

  async pay() {
    this.loading = true;
    try {
      const response = await this.tonderService.payment(paymentData);
      console.log("Payment successful:", response);
      alert("Payment successful");
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed");
    } finally {
      this.loading = false;
    }
  }
}
```

## Notes

### General

- Replace `'your-api-key'`, `'http://your-website.com/checkout'`, `customStyles`, and `paymentData` with your actual values.
- The `paymentData` should be defined according to your specific requirements.

### Script Dependencies

For all implementations, ensure you include the necessary scripts:

```html
<script src="https://js.skyflow.com/v1/index.js"></script>
<script src="https://openpay.s3.amazonaws.com/openpay.v1.min.js"></script>
<script src="https://openpay.s3.amazonaws.com/openpay-data.v1.min.js"></script>
<!-- Only if not use npm package   -->
<script src="https://zplit-prod.s3.amazonaws.com/v1/bundle.min.js"></script>
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
