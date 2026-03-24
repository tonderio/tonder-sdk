# tonder-web-sdk

PCI DSS–compliant payment SDK for web applications.
Card data is collected through **Skyflow secure iframes** — raw card values never touch your application code.

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Installation](#2-installation)
3. [Choosing an Integration](#3-choosing-an-integration)
4. [Constructor & Configuration](#4-constructor--configuration)
   - [4.1 InlineCheckout options](#41-inlinecheckout-options)
   - [4.2 LiteInlineCheckout options](#42-liteinlinecheckout-options)
   - [4.3 Secure token](#43-secure-token)
   - [4.4 Form events](#44-form-events-icardvents)
5. [Initialization Sequence](#5-initialization-sequence)
6. [Collecting Card Data — `mountCardFields`](#6-collecting-card-data--mountcardfields-liteinlinecheckout)
   - [6.1 New-card form (all 5 fields)](#61-new-card-form-all-5-fields)
   - [6.2 Saved-card CVV only](#62-saved-card-cvv-only)
   - [6.3 Unmounting fields](#63-unmounting-fields)
7. [Processing Payments](#7-processing-payments)
   - [7.1 New card](#71-new-card-payment)
   - [7.2 Pay with a saved card](#72-pay-with-a-saved-card)
   - [7.3 Alternative Payment Method (APM)](#73-alternative-payment-method-apm)
   - [7.4 Payment response reference](#74-payment-response-reference)
8. [3DS Handling](#8-3ds-handling)
9. [Managing Saved Cards](#9-managing-saved-cards-liteinlinecheckout)
   - [9.1 List saved cards](#91-list-saved-cards)
   - [9.2 Save a new card (enrollment)](#92-save-a-new-card-enrollment)
   - [9.3 Remove a card](#93-remove-a-card)
10. [Revealing Card Data — `revealCardFields`](#10-revealing-card-data--revealcardfields-liteinlinecheckout)
11. [Error Handling](#11-error-handling)
    - [11.1 Error structure](#111-error-structure)
    - [11.2 Error code reference](#112-error-code-reference)
12. [Customization & Styling](#12-customization--styling)
    - [12.1 InlineCheckout styles](#121-inlinecheckout-styles)
    - [12.2 LiteInlineCheckout styles](#122-liteinlinecheckout-styles)
    - [12.3 Labels & placeholders](#123-labels--placeholders-liteinlinecheckout)
    - [12.4 InlineCheckout UI customization](#124-inlinecheckout-ui-customization)
13. [Framework Examples](#13-framework-examples)
    - [13.1 Vanilla JS — InlineCheckout](#131-vanilla-js--inlinecheckout)
    - [13.2 Vanilla JS — LiteInlineCheckout](#132-vanilla-js--liteinlinecheckout)
    - [13.3 React / Next.js](#133-react--nextjs)
    - [13.4 Angular](#134-angular)
14. [HMAC Signature Validation](#14-hmac-signature-validation)
15. [Deprecated API](#15-deprecated-api)
16. [License](#16-license)

---

## 1. Quick Start

Get a working payment form in under 5 minutes using **InlineCheckout** (pre-built UI):

```html
<!-- index.html -->
<script src="https://js.skyflow.com/v1/index.js"></script>

<!-- Checkout mounts here -->
<div id="tonder-checkout"></div>
```

```js
import { InlineCheckout } from "tonder-web-sdk";

const checkout = new InlineCheckout({
  apiKey: "YOUR_PUBLIC_API_KEY",
  mode: "stage",
  returnUrl: `${window.location.origin}/checkout`,
});

// Fetch a secure token from your backend (see Section 4.3)
const { access } = await fetch("/api/tonder-secure-token", { method: "POST" }).then((r) =>
  r.json()
);

checkout.configureCheckout({
  customer: { email: "user@example.com" },
  secureToken: access,
});

await checkout.injectCheckout();

// Handle returning from a 3DS redirect
const tdsResult = await checkout.verify3dsTransaction();
if (tdsResult) {
  console.log("3DS result:", tdsResult.transaction_status);
}
```

```js
// Trigger payment from your own Pay button
const response = await checkout.payment({
  customer: { firstName: "John", lastName: "Doe", email: "user@example.com" },
  cart: { total: 100, items: [{ name: "Product A", description: "...", quantity: 1, price_unit: 100, discount: 0, taxes: 0, product_reference: "SKU-001", amount_total: 100 }] },
  currency: "MXN",
});
console.log("Transaction status:", response.transaction_status);
```

> **Security note:** `YOUR_SECRET_API_KEY` is a server-side credential. In production, fetch the secure token from your own backend and return only the `access` value to the client. See [Section 4.3](#43-secure-token).

---

## 2. Installation

Choose **one** of the following installation methods:

### Option A — NPM (recommended for bundlers)

```bash
npm install tonder-web-sdk
# or
yarn add tonder-web-sdk
```

```js
import { InlineCheckout } from "tonder-web-sdk";
```

### Option B — Script Tag (no bundler)

Choose the URL that matches your environment:

```html
<!-- Stage -->
<script src="https://zplit-stage.s3.amazonaws.com/v2/bundle.min.js"></script>

<!-- Production -->
<script src="https://zplit-prod.s3.amazonaws.com/v2/bundle.min.js"></script>
```

Both URLs expose `window.TonderSdk`. Use one at a time:

```js
// InlineCheckout
const { InlineCheckout } = window.TonderSdk;

// or LiteInlineCheckout
const { LiteInlineCheckout } = window.TonderSdk;
```

### Required Dependencies

Add these scripts to the `<head>` of every page that uses the SDK:

```html
<script src="https://js.skyflow.com/v1/index.js"></script>
```

---

## 3. Choosing an Integration

| | `InlineCheckout` | `LiteInlineCheckout` |
|---|---|---|
| **UI** | Pre-built, fully styled checkout UI | Headless — you own the markup |
| **Card collection** | Automatically renders Skyflow iframes | You call `mountCardFields()` into your own `<div>` |
| **Saved cards** | Built-in saved-card list UI | Fetch with `getCustomerCards()`, render yourself |
| **APMs** | Built-in APM selector UI | Fetch with `getCustomerPaymentMethods()`, render yourself |
| **Customization** | `customization` options (show/hide sections, dark mode) | Full control over layout and styling |
| **Best for** | Drop-in checkout with minimal code | Fully custom checkout experiences |

---

## 4. Constructor & Configuration

### 4.1 InlineCheckout options

```js
import { InlineCheckout } from "tonder-web-sdk";

const checkout = new InlineCheckout(options);
```

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `apiKey` | `string` | **Required** | — | Public API key from the Tonder Dashboard |
| `returnUrl` | `string` | **Required for 3DS** | — | URL the browser returns to after a 3DS redirect |
| `mode` | `'stage' \| 'production'` | Optional | `'stage'` | Target environment |
| `styles` | `ICardStyles` | Optional | `undefined` | Card field styles — see [Section 12.1](#121-inlinecheckout-styles) |
| `customization` | `CustomizationOptions` | Optional | `undefined` | UI controls (show/hide sections, dark mode) — see [Section 12.4](#124-inlinecheckout-ui-customization) |
| `callbacks` | `IInlineCallbacks` | Optional | `undefined` | `onCancel` callback |
| `events` | `ICardEvents` | Optional | `undefined` | Per-field `onChange` / `onFocus` / `onBlur` — see [Section 4.4](#44-form-events-icardvents) |
| `signatures` | `{ transaction?: string; customer?: string }` | Optional | `undefined` | HMAC signatures — see [Section 14](#14-hmac-signature-validation) |

**`IInlineCallbacks`:**

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onCancel` | none | Called when the user clicks the cancel button |

**Environment URLs:**

| `mode` | Base URL |
|--------|----------|
| `'stage'` | `https://stage.tonder.io` |
| `'production'` | `https://app.tonder.io` |

---

### 4.2 LiteInlineCheckout options

```js
import { LiteInlineCheckout } from "tonder-web-sdk";

const liteCheckout = new LiteInlineCheckout(options);
```

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `apiKey` | `string` | **Required** | — | Public API key from the Tonder Dashboard |
| `returnUrl` | `string` | **Required for 3DS** | — | URL the browser returns to after a 3DS redirect |
| `mode` | `'stage' \| 'production'` | Optional | `'stage'` | Target environment |
| `customization` | `ILiteCustomization` | Optional | `undefined` | Styles, labels, and placeholders — see [Section 12.2](#122-liteinlinecheckout-styles) |
| `events` | `ICardEvents` | Optional | `undefined` | Per-field `onChange` / `onFocus` / `onBlur` — see [Section 4.4](#44-form-events-icardvents) |
| `signatures` | `{ transaction?: string; customer?: string }` | Optional | `undefined` | HMAC signatures — see [Section 14](#14-hmac-signature-validation) |

---

### 4.3 Secure token

The secure token is a short-lived credential required for `configureCheckout`. Fetch it from Tonder's API using your **secret API key**:

```js
// Base URL by mode: stage → https://stage.tonder.io, production → https://app.tonder.io
const baseUrl = "https://stage.tonder.io";

const { access } = await fetch(`${baseUrl}/api/secure-token/`, {
  method: "POST",
  headers: {
    Authorization: "Token YOUR_SECRET_API_KEY",
    "Content-Type": "application/json",
  },
}).then((r) => r.json());
```

> **Security note:** `YOUR_SECRET_API_KEY` is a server-side credential. In production, make this request from your own backend and return only the `access` token to the frontend. Never expose your secret key in client-side code.

---

### 4.4 Form events (`ICardEvents`)

Register callbacks to react to field state changes. Works the same way for both `InlineCheckout` and `LiteInlineCheckout`.

```js
const events = {
  cardNumberEvents: {
    onChange: ({ isValid, isEmpty }) => {
      setCardValid(isValid);
    },
    onBlur: ({ isValid, isEmpty }) => {
      setShowCardError(!isValid && !isEmpty);
    },
  },
  cvvEvents: {
    onChange: ({ isValid }) => {
      setCvvValid(isValid);
    },
  },
};

new InlineCheckout({ ..., events });
// or
new LiteInlineCheckout({ ..., events });
```

**`ICardEvents` shape:**

```js
{
  cardHolderEvents?: { onChange?, onFocus?, onBlur? },
  cardNumberEvents?: { onChange?, onFocus?, onBlur? },
  cvvEvents?:        { onChange?, onFocus?, onBlur? },
  monthEvents?:      { onChange?, onFocus?, onBlur? },
  yearEvents?:       { onChange?, onFocus?, onBlur? },
}
```

**Event payload (`ICardEventPayload`):**

| Field | Type | Description |
|-------|------|-------------|
| `elementType` | `string` | Field name (e.g. `'CARD_NUMBER'`, `'CVV'`) |
| `isEmpty` | `boolean` | `true` when the field has no input |
| `isFocused` | `boolean` | `true` when the field currently has focus |
| `isValid` | `boolean` | `true` when the field passes validation |
| `value` | `string` | See PCI note below |

> **PCI note:** In `production`, `card_number` returns a **partially masked** value (first 8 digits for non-AMEX, first 6 for AMEX, rest masked). All other fields — including `cvv` — return `value: ''`. In `stage`/`development`, all fields return the actual value. Use `isValid` and `isEmpty` for UI state logic — never depend on `value` for business logic in production.

---

## 5. Initialization Sequence

Both checkouts must be initialized in this exact order:

```
1. new InlineCheckout(options)  /  new LiteInlineCheckout(options)
         ↓
2. Fetch secure token from YOUR backend  →  { access: string }
         ↓
3. configureCheckout({ customer, secureToken, ...optional })
         ↓
4. await injectCheckout()
         ↓
5. result = await verify3dsTransaction()
         ↓ if result → handle 3DS return; if void → continue ↓
6. (LiteInlineCheckout only) await mountCardFields(...)
```

### `configureCheckout(data)`

Sets the customer identity and secure token. You can also pass payment defaults here — any field provided again in `payment()` overrides them.

```js
checkout.configureCheckout({
  customer: { email: "user@example.com" },  // Required
  secureToken: access,                       // Required — from the token fetch
  // Optional payment defaults:
  // cart: { total: 100, items: [...] },
  // currency: "MXN",
  // metadata: { order_id: "ORD-001" },
});
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customer` | `{ email: string }` or full `ICustomer` | **Required** | Customer identity |
| `secureToken` | `string` | **Required** | Short-lived token from `/api/secure-token/` |
| `cart` | `{ total, items }` | Optional | Can be set here or overridden in `payment()` |
| `currency` | `string` | Optional | ISO currency code (e.g. `'MXN'`) |
| `metadata` | `Record<string, any>` | Optional | Reporting fields (see [Section 7.1](#71-new-card-payment)) |

### `injectCheckout()`

Initializes the checkout session. Must be **awaited** before calling `mountCardFields` or `payment`.

```js
await checkout.injectCheckout();
```

### `verify3dsTransaction()`

Call this on **every page load**. When the page is loaded as a return from a 3DS redirect, it verifies the transaction and resolves with the result. On a normal page load it resolves with `void`.

```js
const tdsResult = await checkout.verify3dsTransaction();

if (tdsResult) {
  // Returning from 3DS
  if (tdsResult.transaction_status === "Success") {
    // Navigate to order confirmation
  } else {
    // Show error to the user
  }
  return; // Do not mount card fields — payment flow already completed
}

// Normal page load — continue initialization
// (LiteInlineCheckout: proceed to mountCardFields)
```

---

## 6. Collecting Card Data — `mountCardFields` (LiteInlineCheckout)

Mounts Skyflow secure iframes into your `<div>` containers. Card values are captured inside the iframe and **never pass through your application code**.

> **Prerequisite:** Container `<div>` elements must exist in the DOM before calling `mountCardFields()`.
> Must be called after `injectCheckout()` resolves.

```js
// IMountCardFieldsRequest
{
  fields: Array<CardField | { field: CardField, container_id?: string }>,
  card_id?: string,            // Omit for new card; skyflow_id for saved-card CVV
  unmount_context?: 'all' | 'current' | 'none' | string,  // default: 'all'
}

// CardField = 'cardholder_name' | 'card_number' | 'expiration_month' | 'expiration_year' | 'cvv'
```

---

### 6.1 New-card form (all 5 fields)

**Default container IDs** (used when no `container_id` is provided):

| Field | Default Container ID |
|-------|---------------------|
| `cardholder_name` | `#collect_cardholder_name` |
| `card_number` | `#collect_card_number` |
| `expiration_month` | `#collect_expiration_month` |
| `expiration_year` | `#collect_expiration_year` |
| `cvv` | `#collect_cvv` |

**HTML:**
```html
<div id="collect_cardholder_name"></div>
<div id="collect_card_number"></div>
<div id="collect_expiration_month"></div>
<div id="collect_expiration_year"></div>
<div id="collect_cvv"></div>
```

**Shorthand (string array):**
```js
await liteCheckout.mountCardFields({
  fields: ["cardholder_name", "card_number", "expiration_month", "expiration_year", "cvv"],
});
```

**Custom container IDs:**
```js
await liteCheckout.mountCardFields({
  fields: [
    { field: "cardholder_name",   container_id: "#my-name" },
    { field: "card_number",       container_id: "#my-card-number" },
    { field: "expiration_month",  container_id: "#my-month" },
    { field: "expiration_year",   container_id: "#my-year" },
    { field: "cvv",               container_id: "#my-cvv" },
  ],
});
```

> **Container sizing:** Skyflow iframes require explicit dimensions on their containers. Add at minimum `display: block; width: 100%; height: 40px` (or your desired height) to each container `<div>`.

---

### 6.2 Saved-card CVV only

For saved-card payments, mount only the CVV field for the selected card. The default container ID becomes `#collect_cvv_<skyflow_id>`.

```html
<!-- Use the card's skyflow_id as part of the container ID -->
<div id="collect_cvv_abc123"></div>
```

```js
await liteCheckout.mountCardFields({
  fields: ["cvv"],
  card_id: "abc123",  // card.fields.skyflow_id
});
```

**Conditional CVV mount pattern:**
```js
function handleSelectCard(card) {
  liteCheckout.mountCardFields({
    fields: ["cvv"],
    card_id: card.fields.skyflow_id,
  });
}
```

---

### 6.3 Unmounting fields

`mountCardFields()` automatically unmounts previously mounted fields before mounting new ones — you don't need to call `unmountCardFields()` manually when switching cards.

The `unmount_context` parameter controls what gets cleared before new fields mount:

| `unmount_context` | Behavior |
|---|---|
| `'all'` (default) | Unmounts all mounted fields across all contexts |
| `'current'` | Unmounts only the current context (new-card or the active saved-card CVV) |
| `'none'` | Does not unmount anything before mounting |

The only time you need to call `unmountCardFields()` directly is when **navigating away** from the checkout:

```js
// Cleanup when leaving the checkout page
liteCheckout.unmountCardFields();
// Or remove the whole checkout:
// checkout.removeCheckout();  (InlineCheckout)
```

> **Important:** Never show the new-card form (all 5 fields) and a saved-card CVV field simultaneously. Only one active CVV input per saved card at a time.

---

## 7. Processing Payments

### 7.1 New card payment

**LiteInlineCheckout prerequisite:** Mount all 5 card fields ([Section 6.1](#61-new-card-form-all-5-fields)) and let the user fill them in before calling `payment()`.

```js
try {
  const response = await checkout.payment({
    customer: {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+1 555 0100",
      country: "MX",
      city: "CDMX",
      street: "123 Main St",
      state: "CMX",
      postCode: "06600",
    },
    cart: {
      total: 150,
      items: [
        {
          name: "Product A",
          description: "Product description",
          quantity: 1,
          price_unit: 150,
          discount: 0,
          taxes: 0,
          product_reference: "SKU-001",
          amount_total: 150,
        },
      ],
    },
    currency: "MXN",
    order_reference: "ORD-001",           // Recommended — shown in Tonder dashboard & exports
    metadata: { order_id: "ORD-001" },    // Recommended — reporting fields
  });

  console.log("Transaction status:", response.transaction_status);
} catch (error) {
  console.error(error.message, error.detail);
}
```

**`IProcessPaymentRequest` fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customer` | `ICustomer` | **Required** | Customer information |
| `cart` | `{ total, items }` | **Required** | Order total and line items |
| `currency` | `string` | Optional | ISO currency code (e.g. `'MXN'`) |
| `order_reference` | `string` | Recommended | Your internal order ID — shown in Tonder dashboard filters and exports |
| `metadata` | `Record<string, any>` | Recommended | Reporting fields (see below) |
| `payment_method` | `string` | Optional | APM identifier (e.g. `'Spei'`) — omit for card payments |
| `card` | `string` | Optional | **LiteInlineCheckout only** — `skyflow_id` of a saved card; omit to pay with mounted card fields |
| `apm_config` | `object` | Optional | APM-specific config (e.g. Mercado Pago preferences) |

**`ICustomer`:**
```js
{
  firstName: "John",    // Required
  lastName: "Doe",      // Required
  email: "john@example.com",  // Required
  phone: "+1 555 0100",
  country: "MX",
  street: "123 Main St",
  city: "CDMX",
  state: "CMX",
  postCode: "06600",
  address: "123 Main St, CDMX",
  identification: { type: "CPF", number: "19119119100" },
}
```

**`IItem`:**
```js
{
  name: "Product A",
  description: "Product description",
  quantity: 1,
  price_unit: 150,
  discount: 0,
  taxes: 0,
  product_reference: "SKU-001",
  amount_total: 150,
}
```

**Metadata for reporting:**

| Field | Report column | Description |
|-------|---------------|-------------|
| `order_reference` | Business Transaction ID | Merchant's internal order ID |
| `metadata.order_id` | Business Transaction ID | Takes precedence over `order_reference` when both are provided |
| `metadata.customer_email` | Customer Email | Overrides the email shown in reports |
| `metadata.customer_id` | Customer ID | Your internal customer identifier |
| `metadata.business_user` | Business User | Internal user or system that initiated the payment |
| `metadata.operation_date` | Operation Date | Business operation date for reconciliation |

---

### 7.2 Pay with a saved card

**LiteInlineCheckout prerequisite:** Mount the CVV field for the selected card ([Section 6.2](#62-saved-card-cvv-only)) before calling `payment()`.

```js
// Pass the card's skyflow_id as the `card` field
const response = await liteCheckout.payment({
  customer: { email: "user@example.com" },
  cart: { total: 100, items: [...] },
  currency: "MXN",
  card: selectedCard.fields.skyflow_id,
});
```

For `InlineCheckout`, saved-card selection is handled automatically by the built-in UI.

---

### 7.3 Alternative Payment Method (APM)

No `mountCardFields()` call is needed for APM payments.

```js
// 1. Fetch available APMs
const apms = await liteCheckout.getCustomerPaymentMethods();
// IPaymentMethod: { id, payment_method, priority, category, icon, label }

// 2. User selects an APM

// 3. Pay
const response = await liteCheckout.payment({
  customer: { email: "user@example.com" },
  cart: { total: 100, items: [...] },
  currency: "MXN",
  payment_method: selectedApm.payment_method,  // e.g. 'Spei'
});
```

**Mercado Pago with `apm_config`:**
```js
const response = await liteCheckout.payment({
  ...paymentData,
  payment_method: "MercadoPago",
  apm_config: {
    back_urls: {
      success: "https://myapp.com/success",
      pending: "https://myapp.com/pending",
      failure: "https://myapp.com/failure",
    },
    auto_return: "approved",
  },
});
```

<details>
<summary>Full Mercado Pago <code>apm_config</code> fields</summary>

| Field | Type | Description |
|-------|------|-------------|
| `binary_mode` | `boolean` | If `true`, payment must be approved or rejected immediately (no pending) |
| `additional_info` | `string` | Extra info shown during checkout |
| `back_urls.success` | `string` | Redirect URL after successful payment |
| `back_urls.pending` | `string` | Redirect URL after pending payment |
| `back_urls.failure` | `string` | Redirect URL after failed/canceled payment |
| `auto_return` | `'approved' \| 'all'` | Enable auto-redirect after payment completion |
| `payment_methods.excluded_payment_methods[].id` | `string` | Payment method to exclude (e.g. `'visa'`) |
| `payment_methods.excluded_payment_types[].id` | `string` | Payment type to exclude (e.g. `'ticket'`) |
| `payment_methods.default_payment_method_id` | `string` | Default payment method |
| `payment_methods.installments` | `number` | Max installments allowed |
| `payment_methods.default_installments` | `number` | Default installments suggested |
| `expires` | `boolean` | Whether the preference has an expiration |
| `expiration_date_from` | `string` (ISO 8601) | Start of validity period |
| `expiration_date_to` | `string` (ISO 8601) | End of validity period |
| `statement_descriptor` | `string` | Text on payer's card statement (max 16 chars) |
| `marketplace` | `string` | Marketplace identifier (default: `'NONE'`) |
| `marketplace_fee` | `number` | Fee to collect as marketplace commission |
| `tracks[].type` | `'google_ad' \| 'facebook_ad'` | Ad tracker type |
| `tracks[].values.conversion_id` | `string` | Google Ads conversion ID |
| `tracks[].values.pixel_id` | `string` | Facebook Pixel ID |
| `shipments.mode` | `'custom' \| 'me2' \| 'not_specified'` | Shipping mode |
| `shipments.cost` | `number` | Shipping cost (custom mode only) |
| `shipments.free_shipping` | `boolean` | Free shipping flag (custom mode only) |
| `differential_pricing.id` | `number` | Differential pricing strategy ID |

</details>

---

### 7.4 Payment response reference

```js
// IStartCheckoutResponse
{
  status: string,
  message: string,
  transaction_status: string,   // 'Success' | 'Pending' | 'Declined' | 'Failed'
  transaction_id: number,
  payment_id: number,
  checkout_id: string,
  is_route_finished: boolean,
  provider: string,
  psp_response: Record<string, any>,  // Raw response from the payment processor
}
```

> **Note:** 3DS authentication is handled automatically by the SDK. You do not need to handle redirects manually.

---

## 8. 3DS Handling

When a payment requires 3DS authentication, the SDK performs a **full-page redirect** to the bank's authentication page. After authentication, the bank sends the user back to `returnUrl`. On that page load, `verify3dsTransaction()` completes the verification.

**How it works:**

1. `payment()` detects the 3DS challenge and redirects the browser to the bank's page
2. User completes authentication
3. Bank redirects back to `returnUrl`
4. Your page calls `verify3dsTransaction()` — it detects the 3DS return, verifies the transaction, and returns the result
5. If routing is configured and the transaction was declined, it automatically retries with the next payment route

**Implementation pattern (call on every page load):**

```js
await checkout.injectCheckout();

const tdsResult = await checkout.verify3dsTransaction();
if (tdsResult) {
  // Returned from 3DS challenge
  const { transaction_status } = tdsResult;
  if (transaction_status === "Success") {
    showOrderConfirmation();
  } else {
    showError(`Payment ${transaction_status}`);
  }
  return; // Do not proceed to mounting card fields
}

// Normal page load — mount card fields (LiteInlineCheckout) or let InlineCheckout render
```

---

## 9. Managing Saved Cards (LiteInlineCheckout)

### 9.1 List saved cards

```js
const { cards } = await liteCheckout.getCustomerCards();
// Returns: ICustomerCardsResponse = { user_id: number, cards: ICard[] }

cards.forEach((card) => {
  const lastFour = card.fields.card_number.slice(-4);
  const expiry = `${card.fields.expiration_month}/${card.fields.expiration_year}`;
  console.log(`${card.fields.card_scheme} •••• ${lastFour} — expires ${expiry}`);
});
```

**`ICard` shape:**

```js
{
  fields: {
    skyflow_id: string,         // Use this as the card identifier in payment()
    card_number: string,        // Masked — e.g. 'XXXX-XXXX-XXXX-4242'
    cardholder_name: string,
    expiration_month: string,   // e.g. '12'
    expiration_year: string,    // e.g. '25'
    card_scheme: string,        // e.g. 'VISA', 'MASTERCARD'
  },
  icon?: string,                // URL to card brand image
}

---

### 9.2 Save a new card (enrollment)

**Prerequisites:** Mount all 5 card fields (`mountCardFields()` with no `card_id`) and let the user fill them in.

```js
// 1. Mount all 5 fields (Section 6.1)
await liteCheckout.mountCardFields({
  fields: ["cardholder_name", "card_number", "expiration_month", "expiration_year", "cvv"],
});

// 2. User fills in the card form...

// 3. Save the card
const saved = await liteCheckout.saveCustomerCard();
console.log("Saved card skyflow_id:", saved.skyflow_id);
// Returns: { skyflow_id: string, user_id: number }

// 4. Optionally reveal the saved card data (Section 10)
await liteCheckout.revealCardFields({
  fields: ["card_number", "cardholder_name", "expiration_month", "expiration_year"],
});
```

---

### 9.3 Remove a card

```js
await liteCheckout.removeCustomerCard(card.fields.skyflow_id);

// Refresh the card list
const { cards } = await liteCheckout.getCustomerCards();
```

---

## 10. Revealing Card Data — `revealCardFields` (LiteInlineCheckout)

After a successful `saveCustomerCard()` or `payment()` with a new card, use `revealCardFields()` to display card data in your UI through secure iframes — raw values are never exposed to your code.

> **When to call:** Only after a successful `saveCustomerCard()` or new-card `payment()`.

**Default container IDs and redaction:**

| Field | Default Container ID | Redaction |
|-------|---------------------|-----------|
| `card_number` | `#reveal_card_number` | `MASKED` — e.g. `4111 11•• •••• 1234` |
| `cardholder_name` | `#reveal_cardholder_name` | `PLAIN_TEXT` |
| `expiration_month` | `#reveal_expiration_month` | `PLAIN_TEXT` |
| `expiration_year` | `#reveal_expiration_year` | `PLAIN_TEXT` |

> **PCI note:** `cvv` cannot be revealed — PCI DSS Requirement 3.2.1 prohibits storing or displaying CVV post-authorization. Redaction levels are fixed by the SDK and cannot be overridden.

> **Container sizing:** Reveal iframes also need explicit dimensions on their containers (e.g. `display: block; width: 100%; height: 26px`).

**Example 1 — Shorthand:**
```html
<div id="reveal_cardholder_name"></div>
<div id="reveal_card_number"></div>
<div id="reveal_expiration_month"></div>
<div id="reveal_expiration_year"></div>
```
```js
await liteCheckout.saveCustomerCard();

await liteCheckout.revealCardFields({
  fields: ["cardholder_name", "card_number", "expiration_month", "expiration_year"],
});
```

**Example 2 — With `altText`, `label`, and per-field options:**
```js
await liteCheckout.revealCardFields({
  fields: [
    { field: "card_number",       altText: "•••• •••• •••• ••••", label: "Card Number" },
    { field: "cardholder_name",   altText: "Loading…", label: "Cardholder" },
    { field: "expiration_month",  label: "Month" },
    { field: "expiration_year",   label: "Year" },
  ],
});
```

**Example 3 — Custom styles (e.g. overlay on a card graphic):**
```js
await liteCheckout.revealCardFields({
  fields: [
    { field: "card_number",      container_id: "#my-card-number-display" },
    { field: "cardholder_name",  container_id: "#my-name-display" },
    { field: "expiration_month", container_id: "#my-month-display" },
    { field: "expiration_year",  container_id: "#my-year-display" },
  ],
  styles: {
    inputStyles: {
      base: {
        color: "#ffffff",
        fontFamily: '"Courier New", monospace',
        fontSize: "16px",
        background: "transparent",
        border: "none",
        letterSpacing: "2px",
      },
    },
  },
});
```

**`IRevealCardFieldsRequest` types:**

```js
// fields: Array of shorthand strings or per-field objects
{
  field: 'card_number' | 'cardholder_name' | 'expiration_month' | 'expiration_year',
  container_id?: string,   // default: #reveal_<field>
  altText?: string,        // Placeholder shown before reveal resolves
  label?: string,          // Label rendered above the field
  styles?: {               // Per-field style override
    inputStyles?: { base?, copyIcon?, global? },
    labelStyles?: { base?, global? },
    errorTextStyles?: { base?, global? },
  },
}

// Top-level styles apply to all fields unless overridden per-field
styles?: {
  inputStyles?: { base?, copyIcon?, global? },
  labelStyles?: { base?, global? },
  errorTextStyles?: { base?, global? },
}
```

> **Style variants:** Reveal elements support only `base`, `copyIcon`, and `global` variants — not `focus`, `complete`, `invalid`, or `empty` (those apply to collect fields only).

---

## 11. Error Handling

### 11.1 Error structure

When a public SDK method fails, it throws a plain error object with the following shape:

```js
{
  status: "error",
  code: 400,        // HTTP status code as number
  message: "...",   // Human-readable description
  detail: "..." | { ... },  // Additional context from the server
}
```

**Catch pattern:**
```js
try {
  const response = await liteCheckout.payment(data);
  console.log("Transaction status:", response.transaction_status);
} catch (error) {
  console.error(`[${error.code}] ${error.message}`);
  // Use error.detail for server response details
}
```

For `InlineCheckout.payment()`, the error is a standard `Error` instance with an additional `.details` property:
```js
try {
  await checkout.payment(data);
} catch (error) {
  console.error(error.message);
  console.error(error.details); // IStartCheckoutErrorResponse from the server
}
```

---

### 11.2 Error code reference

| `code` | HTTP Status | Thrown by | When |
|--------|-------------|-----------|------|
| `400` | 400 | `payment()`, `saveCustomerCard()` | Validation error or bad request |
| `401` | 401 | Any method | Invalid or missing API key |
| `403` | 403 | Any method | HMAC signature mismatch |
| `404` | 404 | `getCustomerCards()`, `removeCustomerCard()` | Customer or card not found |
| `500` | 500 | Any method | Unexpected server error |

---

## 12. Customization & Styling

### 12.1 InlineCheckout styles

Pass styles inside `customization.styles`. Uses `ICardStyles` with optional per-field overrides.

```js
new InlineCheckout({
  apiKey: "YOUR_KEY",
  returnUrl: "https://myapp.com/checkout",
  customization: {
    styles: {
      // Show the card brand icon inside the card number field (default: true)
      enableCardIcon: true,

      // Global styles applied to all fields
      cardForm: {
        inputStyles: {
          base: {
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            color: "#1d1d1f",
            border: "1px solid #d1d1d6",
            borderRadius: "8px",
            padding: "10px 12px",
            backgroundColor: "#ffffff",
          },
          focus: {
            borderColor: "#6200ee",
            boxShadow: "0 0 0 3px rgba(98, 0, 238, 0.15)",
            outline: "none",
          },
          complete: { borderColor: "#34c759" },
          invalid:  { borderColor: "#ff3b30", color: "#ff3b30" },
          cardIcon: { position: "absolute", left: "6px", bottom: "calc(50% - 12px)" },
          global: {
            "@import": 'url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap")',
          },
        },
        labelStyles: {
          base: { fontSize: "12px", fontWeight: "500", color: "#6e6e73", marginBottom: "4px" },
        },
        errorStyles: {
          base: { color: "#ff3b30", fontSize: "11px", marginTop: "4px" },
        },
      },

      // Per-field overrides — take priority over cardForm
      cardNumber: {
        inputStyles: {
          base: { letterSpacing: "2px" },
        },
      },
      cvv: {
        inputStyles: {
          base:    { backgroundColor: "#faf5ff" },
          invalid: { borderColor: "#e74c3c" },
        },
      },
    },
  },
});
```

**`ICardStyles` shape:**

```js
{
  enableCardIcon?: boolean,      // default: true
  cardForm?: ICardFormStyles,    // Global styles for all fields
  cardholderName?: ICardFormStyles,
  cardNumber?: ICardFormStyles,
  cvv?: ICardFormStyles,
  expirationMonth?: ICardFormStyles,
  expirationYear?: ICardFormStyles,
}

// ICardFormStyles:
{
  inputStyles?: {
    base?, focus?, complete?, invalid?, empty?,
    cardIcon?,   // Card brand icon position (card_number only)
    global?,     // CSS @import or global rules
  },
  labelStyles?: { base? },
  errorStyles?: { base? },
}
```

> **Backward compatibility:** Passing `styles` at the **root** of `InlineCheckout` options is still supported but **deprecated** — move it to `customization.styles`. If both are provided, `customization.styles` takes precedence. Passing a flat `{ inputStyles, labelStyles, errorTextStyles }` object is also still supported but deprecated — wrap it in `{ cardForm: { ... } }`. See [Section 15](#15-deprecated-api).

---

### 12.2 LiteInlineCheckout styles

Pass styles inside `customization.styles`. Uses the same `ICardStyles` format:

```js
new LiteInlineCheckout({
  apiKey: "YOUR_KEY",
  returnUrl: "https://myapp.com/checkout",
  customization: {
    styles: {
      enableCardIcon: true,
      cardForm: {
        inputStyles: {
          base: {
            border: "1px solid #d1d1d6",
            borderRadius: "8px",
            padding: "10px 12px",
          },
          focus: {
            borderColor: "#6200ee",
            boxShadow: "0 0 0 3px rgba(98, 0, 238, 0.15)",
          },
          complete: { borderColor: "#34c759" },
          invalid:  { borderColor: "#ff3b30" },
        },
        labelStyles: {
          base: { fontSize: "12px", fontWeight: "500", color: "#6e6e73" },
        },
        errorStyles: {
          base: { color: "#ff3b30", fontSize: "11px" },
        },
      },
      // Per-field override
      cvv: {
        inputStyles: {
          base: { borderColor: "#8e44ad", backgroundColor: "#faf5ff" },
        },
        labelStyles: {
          base: { color: "#8e44ad", fontWeight: "600" },
        },
      },
    },
  },
});
```

---

### 12.3 Labels & placeholders (LiteInlineCheckout)

```js
new LiteInlineCheckout({
  customization: {
    labels: {
      cardholder_name: "Name on Card",
      card_number: "Card Number",
      cvv: "CVC / CVV",
      expiration_month: "Month",
      expiration_year: "Year",
    },
    placeholders: {
      cardholder_name: "Name as it appears on the card",
      card_number: "1234 5678 9012 3456",
      cvv: "3–4 digits",
      expiration_month: "MM",
      expiration_year: "YY",
    },
  },
});
```

---

### 12.4 InlineCheckout UI customization

Control visibility and behavior of the pre-built checkout UI:

```js
new InlineCheckout({
  customization: {
    displayMode: "light",         // 'light' | 'dark'
    saveCards: {
      showSaveCardOption: true,   // Show "Save card" checkbox
      showSaved: true,            // Show list of saved cards
      autoSave: false,            // Auto-save without showing the checkbox
    },
    paymentButton: {
      show: true,
      text: "Pay",
      showAmount: true,           // Show amount on the button, e.g. "Pay $100"
    },
    cancelButton: {
      show: false,
      text: "Cancel",
    },
    paymentMethods: {
      show: true,                 // Show APM section
    },
    cardForm: {
      show: true,                 // Show the card form
    },
    showMessages: true,           // Show error/success messages
  },
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `displayMode` | `'light' \| 'dark'` | `'light'` | Color scheme |
| `saveCards.showSaveCardOption` | `boolean` | `true` | Show "Save this card" checkbox |
| `saveCards.showSaved` | `boolean` | `true` | Show saved card list |
| `saveCards.autoSave` | `boolean` | `false` | Silently save the card without showing the option |
| `paymentButton.show` | `boolean` | `true` | Show the payment button |
| `paymentButton.text` | `string` | `'Pagar'` | Payment button label |
| `paymentButton.showAmount` | `boolean` | `true` | Append amount to button label |
| `cancelButton.show` | `boolean` | `false` | Show the cancel button |
| `cancelButton.text` | `string` | `'Cancelar'` | Cancel button label |
| `paymentMethods.show` | `boolean` | `true` | Show APM section |
| `cardForm.show` | `boolean` | `true` | Show the card form |
| `showMessages` | `boolean` | `true` | Show validation and status messages |

---

## 13. Framework Examples

### 13.1 Vanilla JS — InlineCheckout

```html
<!doctype html>
<html lang="en">
  <head>
    <script src="https://js.skyflow.com/v1/index.js"></script>
    <script src="https://zplit-prod.s3.amazonaws.com/v2/bundle.min.js"></script>
  </head>
  <body>
    <div id="tonder-checkout"></div>
    <button id="pay-btn">Pay</button>

    <script>
      const { InlineCheckout } = window.TonderSdk;

      const checkout = new InlineCheckout({
        apiKey: "YOUR_PUBLIC_API_KEY",
        mode: "stage",
        returnUrl: window.location.href,
        customization: {
          paymentButton: { show: false },
        },
      });

      async function init() {
        // In production, fetch this from your backend
        const { access } = await fetch("https://stage.tonder.io/api/secure-token/", {
          method: "POST",
          headers: { Authorization: "Token YOUR_SECRET_KEY", "Content-Type": "application/json" },
        }).then((r) => r.json());

        checkout.configureCheckout({
          customer: { email: "user@example.com" },
          secureToken: access,
        });

        await checkout.injectCheckout();

        const tdsResult = await checkout.verify3dsTransaction();
        if (tdsResult) {
          alert("Payment " + tdsResult.transaction_status);
          return;
        }
      }

      document.getElementById("pay-btn").addEventListener("click", async () => {
        try {
          const response = await checkout.payment({
            customer: { firstName: "John", lastName: "Doe", email: "user@example.com" },
            cart: { total: 100, items: [{ name: "Item", description: "Desc", quantity: 1, price_unit: 100, discount: 0, taxes: 0, product_reference: "SKU-1", amount_total: 100 }] },
            currency: "MXN",
          });
          alert("Transaction status: " + response.transaction_status);
        } catch (e) {
          alert("Error: " + e.message);
        }
      });

      init();
    </script>
  </body>
</html>
```

---

### 13.2 Vanilla JS — LiteInlineCheckout

This example shows a complete enrollment flow: mount fields → save card → reveal card data.

```html
<!doctype html>
<html lang="en">
  <head>
    <script src="https://js.skyflow.com/v1/index.js"></script>
    <script src="https://zplit-prod.s3.amazonaws.com/v2/bundle.min.js"></script>
    <style>
      /* Skyflow iframes need explicit dimensions */
      .card-field { display: block; width: 100%; height: 44px; margin-bottom: 12px; }
      .reveal-field { display: block; width: 100%; height: 26px; }
    </style>
  </head>
  <body>
    <!-- Collect iframes mount here -->
    <div id="collect_cardholder_name" class="card-field"></div>
    <div id="collect_card_number" class="card-field"></div>
    <div id="collect_expiration_month" class="card-field"></div>
    <div id="collect_expiration_year" class="card-field"></div>
    <div id="collect_cvv" class="card-field"></div>
    <button id="save-btn">Save Card</button>

    <!-- Reveal iframes mount here after save -->
    <div id="card-result" style="display:none">
      <div id="reveal_cardholder_name" class="reveal-field"></div>
      <div id="reveal_card_number" class="reveal-field"></div>
      <div id="reveal_expiration_month" class="reveal-field"></div>
      <div id="reveal_expiration_year" class="reveal-field"></div>
    </div>

    <script>
      const { LiteInlineCheckout } = window.TonderSdk;

      const liteCheckout = new LiteInlineCheckout({
        apiKey: "YOUR_PUBLIC_API_KEY",
        mode: "stage",
        returnUrl: window.location.href,
      });

      async function init() {
        const { access } = await fetch("https://stage.tonder.io/api/secure-token/", {
          method: "POST",
          headers: { Authorization: "Token YOUR_SECRET_KEY", "Content-Type": "application/json" },
        }).then((r) => r.json());

        liteCheckout.configureCheckout({
          customer: { email: "user@example.com" },
          secureToken: access,
        });

        await liteCheckout.injectCheckout();

        const tdsResult = await liteCheckout.verify3dsTransaction();
        if (tdsResult) {
          alert("Payment " + tdsResult.transaction_status);
          return;
        }

        await liteCheckout.mountCardFields({
          fields: ["cardholder_name", "card_number", "expiration_month", "expiration_year", "cvv"],
        });
      }

      document.getElementById("save-btn").addEventListener("click", async () => {
        try {
          const saved = await liteCheckout.saveCustomerCard();
          console.log("Saved skyflow_id:", saved.skyflow_id);

          document.getElementById("card-result").style.display = "block";

          await liteCheckout.revealCardFields({
            fields: ["cardholder_name", "card_number", "expiration_month", "expiration_year"],
            styles: {
              inputStyles: {
                base: { fontSize: "16px", color: "#1d1d1f", border: "none", background: "transparent" },
              },
            },
          });
        } catch (e) {
          alert("Error: " + e.message);
        }
      });

      init();
    </script>
  </body>
</html>
```

---

### 13.3 React / Next.js

```jsx
import { useEffect, useRef } from "react";
import { LiteInlineCheckout } from "tonder-web-sdk";

export default function CheckoutPage() {
  const checkoutRef = useRef(null);

  useEffect(() => {
    const liteCheckout = new LiteInlineCheckout({
      apiKey: process.env.NEXT_PUBLIC_TONDER_API_KEY,
      mode: "production",
      returnUrl: `${window.location.origin}/checkout`,
    });
    checkoutRef.current = liteCheckout;

    async function init() {
      // Fetch secure token from your Next.js API route
      const { access } = await fetch("/api/tonder-token", { method: "POST" }).then((r) => r.json());

      liteCheckout.configureCheckout({
        customer: { email: "user@example.com" },
        secureToken: access,
      });

      await liteCheckout.injectCheckout();

      const tdsResult = await liteCheckout.verify3dsTransaction();
      if (tdsResult) {
        if (tdsResult.transaction_status === "Success") {
          // router.push('/order-confirmation')
        }
        return;
      }

      await liteCheckout.mountCardFields({
        fields: ["cardholder_name", "card_number", "expiration_month", "expiration_year", "cvv"],
      });
    }

    init();

    return () => {
      // Cleanup on unmount
      liteCheckout.unmountCardFields();
    };
  }, []);

  async function handlePay() {
    try {
      const response = await checkoutRef.current.payment({
        customer: { firstName: "John", lastName: "Doe", email: "user@example.com" },
        cart: { total: 100, items: [{ name: "Product", description: "...", quantity: 1, price_unit: 100, discount: 0, taxes: 0, product_reference: "SKU-1", amount_total: 100 }] },
        currency: "MXN",
      });
      console.log("Status:", response.transaction_status);
    } catch (error) {
      console.error(error.message, error.detail);
    }
  }

  return (
    <div>
      <div id="collect_cardholder_name" style={{ display: "block", width: "100%", height: 44 }} />
      <div id="collect_card_number"     style={{ display: "block", width: "100%", height: 44 }} />
      <div id="collect_expiration_month" style={{ display: "block", width: "100%", height: 44 }} />
      <div id="collect_expiration_year"  style={{ display: "block", width: "100%", height: 44 }} />
      <div id="collect_cvv"             style={{ display: "block", width: "100%", height: 44 }} />
      <button onClick={handlePay}>Pay</button>
    </div>
  );
}
```

**Next.js API route** (`/pages/api/tonder-token.js`):
```js
// This runs on the server — safe to use the secret key here
export default async function handler(req, res) {
  const { access } = await fetch("https://app.tonder.io/api/secure-token/", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.TONDER_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  }).then((r) => r.json());

  res.json({ access });
}
```

---

### 13.4 Angular

**Component template:**
```html
<!-- Secure iframes — card values never touch your code -->
<div id="collect_cardholder_name"  class="card-field"></div>
<div id="collect_card_number"      class="card-field"></div>
<div id="collect_expiration_month" class="card-field"></div>
<div id="collect_expiration_year"  class="card-field"></div>
<div id="collect_cvv"              class="card-field"></div>

<button (click)="pay()" [disabled]="loading">
  {{ loading ? 'Processing...' : 'Pay' }}
</button>
```

**Component class:**
```typescript
import { Component, OnInit, OnDestroy } from "@angular/core";
import { LiteInlineCheckout } from "tonder-web-sdk";

@Component({ selector: "app-checkout", templateUrl: "./checkout.component.html" })
export class CheckoutComponent implements OnInit, OnDestroy {
  private liteCheckout!: LiteInlineCheckout;
  loading = false;

  async ngOnInit() {
    this.liteCheckout = new LiteInlineCheckout({
      apiKey: environment.tonderApiKey,
      mode: "production",
      returnUrl: `${window.location.origin}/checkout`,
    });

    // Fetch from your Angular backend — never expose the secret key on the frontend
    const { access } = await this.tonderTokenService.getSecureToken().toPromise();

    this.liteCheckout.configureCheckout({
      customer: { email: "user@example.com" },
      secureToken: access,
    });

    await this.liteCheckout.injectCheckout();

    const tdsResult = await this.liteCheckout.verify3dsTransaction();
    if (tdsResult) {
      // Handle 3DS return
      return;
    }

    await this.liteCheckout.mountCardFields({
      fields: ["cardholder_name", "card_number", "expiration_month", "expiration_year", "cvv"],
    });
  }

  ngOnDestroy() {
    this.liteCheckout?.unmountCardFields();
  }

  async pay() {
    this.loading = true;
    try {
      const response = await this.liteCheckout.payment({
        customer: { firstName: "John", lastName: "Doe", email: "user@example.com" },
        cart: {
          total: 100,
          items: [{ name: "Product", description: "Desc", quantity: 1, price_unit: 100, discount: 0, taxes: 0, product_reference: "SKU-1", amount_total: 100 }],
        },
        currency: "MXN",
        order_reference: "ORD-001",
      });
      console.log("Transaction status:", response.transaction_status);
    } catch (error) {
      console.error(error.message);
    } finally {
      this.loading = false;
    }
  }
}
```

---

## 14. HMAC Signature Validation

Tonder supports HMAC validation to ensure request data is not tampered with in transit.

### Overview

- You receive an **API Secret Key** from Tonder
- You generate an HMAC-SHA256 signature (Base64-encoded) from the request body
- Tonder compares your signature with its own calculation
- A mismatch results in a **403**

> **Important:** HMAC generation must be done on your **backend server**, not in client-side code.

### Generating the signature (Node.js)

```js
const crypto = require("crypto");

function generateHMAC(secretKey, requestBody) {
  const dataString = JSON.stringify(requestBody);
  return crypto.createHmac("sha256", secretKey).update(dataString).digest("base64");
}

const secretKey = "YOUR_SECRET_KEY";
const requestBody = {
  customer: { email: "user@example.com", firstName: "John", lastName: "Doe" },
  currency: "mxn",
  cart: { total: 100, items: [{ amount_total: 100, description: "Item" }] },
};

const signature = generateHMAC(secretKey, requestBody);
```

### Providing signatures in the SDK

```js
const checkout = new InlineCheckout({
  apiKey: "YOUR_PUBLIC_API_KEY",
  returnUrl: "https://myapp.com/checkout",
  signatures: {
    transaction: "<Base64 HMAC>",  // For payment requests
    customer: "<Base64 HMAC>",     // For card operations (save, delete)
  },
});
```

> Always confirm with Tonder which fields must be included in the signed payload and whether alphabetical key ordering is required. A mismatch results in a **403**.

---

## 15. Deprecated API

<details>
<summary>Show deprecated features</summary>

### Raw card data in `payment()` — removed

Passing raw card fields (`card_number`, `cvv`, etc.) to `payment()` is no longer supported. Card data must be collected through Skyflow secure iframes via `mountCardFields()`.

```js
// ❌ Removed — no longer works
await liteCheckout.payment({
  card: {
    card_number: "4111111111111111",
    cvv: "123",
    expiration_month: "12",
    expiration_year: "25",
    cardholder_name: "John Doe",
  },
  // ...
});

// ✅ Current — mount fields first, then pay with no card field (new card)
await liteCheckout.mountCardFields({
  fields: ["cardholder_name", "card_number", "expiration_month", "expiration_year", "cvv"],
});
await liteCheckout.payment({ customer, cart, currency });

// ✅ Or pay with a saved card using its skyflow_id
await liteCheckout.payment({ customer, cart, currency, card: "skyflow_id_here" });
```

### `saveCustomerCard(cardData)` — raw data param removed

`saveCustomerCard()` no longer accepts a `cardData` argument. Mount all 5 card fields first.

```js
// ❌ Removed
await liteCheckout.saveCustomerCard({ card_number: "...", cvv: "...", ... });

// ✅ Current
await liteCheckout.mountCardFields({
  fields: ["cardholder_name", "card_number", "expiration_month", "expiration_year", "cvv"],
});
await liteCheckout.saveCustomerCard();
```

### `InlineCheckout` root-level `styles` — deprecated

Passing `styles` at the root of `InlineCheckout` options is deprecated. Move it to `customization.styles`.
If both are provided, `customization.styles` takes precedence.

```js
// ⚠️ Deprecated — still works, but will be removed in a future major version
new InlineCheckout({
  styles: { cardForm: { inputStyles: { base: { border: "1px solid #ccc" } } } },
});

// ✅ Current
new InlineCheckout({
  customization: {
    styles: { cardForm: { inputStyles: { base: { border: "1px solid #ccc" } } } },
  },
});
```

### Flat `styles` format in InlineCheckout — deprecated

Passing a flat `{ inputStyles, labelStyles, errorTextStyles }` object inside `styles` is deprecated.
Use `{ cardForm: { ... } }` instead. Note the key rename: `errorTextStyles` → `errorStyles`.

```js
// ⚠️ Deprecated
new InlineCheckout({
  customization: {
    styles: {
      inputStyles: { base: { border: "1px solid #ccc" } },
      labelStyles: { base: { fontSize: "12px" } },
      errorTextStyles: { base: { color: "#f44336" } },
    },
  },
});

// ✅ Current
new InlineCheckout({
  customization: {
    styles: {
      cardForm: {
        inputStyles: { base: { border: "1px solid #ccc" } },
        labelStyles: { base: { fontSize: "12px" } },
        errorStyles: { base: { color: "#f44336" } },
      },
    },
  },
});
```

### Field validation functions — no longer needed

The following validation utilities are still exported but are no longer needed. Skyflow secure iframes handle all card field validation internally.

```js
// No longer needed — Skyflow iframes validate fields automatically
import {
  validateCardNumber,
  validateCardholderName,
  validateCVV,
  validateExpirationDate,
  validateExpirationMonth,
  validateExpirationYear,
} from "tonder-web-sdk";
```

Use the `events.cardNumberEvents.onBlur` / `onChange` callbacks with `{ isValid }` instead — see [Section 4.4](#44-form-events-icardvents).

### `getSkyflowTokens` — removed

The `getSkyflowTokens` helper has been removed. Use `saveCustomerCard()` to tokenize card data, and `revealCardFields()` to display it — see [Section 9.2](#92-save-a-new-card-enrollment) and [Section 10](#10-revealing-card-data--revealcardfields-liteinlinecheckout).

</details>

---

## 16. License

Copyright © Tonder. All rights reserved.
