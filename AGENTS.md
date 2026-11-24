# AGENTS.md

Guide for agents and people working in this repository, the browser payment SDK that bundles to UMD
(`window.TonderSdk`). The integration guide for merchants is `README.md`; this file is how to work here.

## Commands

| Command                             | What it does                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run build`                     | Production build to `v2/bundle.min.js` (minified, obfuscated)                                     |
| `npm run build-stage`               | Non-minified build to `v2/bundle.js`                                                              |
| `npm run start`                     | Webpack dev server                                                                                |
| `npm test`                          | Vitest unit tests in `src/__tests__` (happy-dom, `fetch` stubbed); run before calling a task done |
| `npm run lint` / `npm run lint:fix` | ESLint on `src/**/*.js`                                                                           |
| `npm run format`                    | Prettier on the whole repository                                                                  |
| `npm run check:no-eval`             | Fails when the built `v2/bundle.min.js` holds a string-evaluation sink                            |

Cypress exists in `cypress/` but is not configured.

## Architecture

```
BaseInlineCheckout       shared initialization, API calls, 3DS flow
├── InlineCheckout       pre-built UI, renders the full checkout HTML
└── LiteInlineCheckout   headless; the developer owns the UI
ThreeDSHandler           3DS verification iframe/redirect flow
```

`src/index.js` exports `InlineCheckout`, `LiteInlineCheckout` and the card validators.

- `src/classes/`: checkout logic. `BaseInlineCheckout` holds the payment orchestration shared by both checkouts.
- `src/data/`: one file per backend resource (cards, customers, orders, APMs, payments API).
- `src/helpers/`: `template.js` builds all checkout HTML and CSS; `skyflow.js` wraps card tokenization; `validations.js` has the card checks; `coreCheckout.js` maps between the Tonder payments API answers and the legacy bodies; `coreSupport.js` maps the payments API's customer, saved-card, payment-method and SafetyPay answers (and its errors) onto the monolith's shapes, so the merchant-facing results do not change.
- `src/shared/`: constants (URLs per environment, messages, element ids) and catalogs (APMs, card logos).
- `src/__tests__/`: tests and their fixtures.

## Conventions

- Every API call goes through `src/shared/utils/apiFetch.js` (`fetchWithSignatureHeaders`); auth is `Authorization: Token {apiKey}`.
- `mode` (`production`, `sandbox`, `stage`, `development`) selects the URLs, resolved in `src/shared/constants/tonderUrl.js`.
- Skyflow tokenizes card data in the browser, so card numbers never reach merchant servers.
- Payment engine: `injectCheckout()` reads the business configuration from the Tonder payments API. With `core_payments_enabled` on, card payments and the APMs the core serves (`isCoreApm` in `paymentEngine.js`, any case, no trimming; the type goes as written) go to its `/transactions/v1/process` and `coreCheckout.js` rebuilds the exact `checkout-router` body; with it off, and for any other APM (SPEI, an unknown code), the flow is `orders`, `payments`, `checkout-router`. The engine is chosen once per payment and stored with the 3DS state; a core error (`503 operations_disabled` included) is returned to the merchant and never retried on the legacy flow. Everything the payments API request carries is built in `buildCoreProcessBody`; extend it there.
- Customer and saved cards follow the same flag as the engine (tokens are not interchangeable): on with `core_payments_enabled`, `POST customer` and the card routes (`GET`/`POST /v1/cards`, `DELETE /v1/cards/{skyflow_id}`) go to the payments API, off they stay on the legacy `customer/` and `business/<id>/cards/` routes. Payment methods, the vault token and the SafetyPay banks always go to the payments API. Card routes take only `Authorization: Bearer <secure token>` and `User-Token`; every other payments API route takes the API key and `X-App-Origin`.
- Telemetry (`@tonder.io/client-telemetry`, pinned exactly) reports only `methodCalled` for public methods, through `_reportMethodCalled` in `BaseInlineCheckout` and `src/helpers/telemetry.js`: sdk `web-sdk-legacy`, version injected at build time (`process.env.SDK_VERSION`, webpack `DefinePlugin` and vitest `define`), endpoint `<payments API>/telemetry`. It never throws, is never awaited and never carries card or buyer data; a new public method calls `_reportMethodCalled`; when a public method is deprecated, pass `{ deprecated: true }` to `methodCalled`. Do not add other events without the owner's decision.
- APMs are catalog-driven: metadata in `src/shared/catalog/paymentMethodsCatalog.js`, identifiers in `src/shared/constants/paymentMethodAPM.js`.
- Style: 100-character lines, double quotes, semicolons (`.prettierrc`).
- Docs change with the code, in the same commit: use the table in When you change X, update Y; a change that leaves a doc stale is incomplete.

## Gotchas

- Production builds apply `webpack-obfuscator`; the output in `v2/` is not readable.
- 3DS state lives in `localStorage` (`verify_transaction_status`) for 20 minutes and carries the engine; a state without an engine is a legacy payment.
- The pre-commit hook runs `npx lint-staged` (Prettier then `lint:fix`) through Husky; `npm ci --ignore-scripts` does not install it.
- `v1/` and `v2/` bundles are committed; a release rebuilds them, a feature commit does not.

## Testing

Vitest with happy-dom; specs in `src/__tests__/*.test.js`, `Skyflow` stubbed in `setup.js`, `fetch` stubbed per test. A behaviour change ships a test that failed first, and the docs it makes stale, in the same commit.

## When you change X, update Y

| You change                                  | Also update                                           |
| ------------------------------------------- | ----------------------------------------------------- |
| A command, script or tooling                | `AGENTS.md` Commands                                  |
| Layout, a convention or a gotcha            | `AGENTS.md`                                           |
| Public options, results, callbacks or flows | `README.md` and `types/`                              |
| A request or answer of the payments API     | `src/helpers/coreCheckout.js`, its tests and fixtures |
| A support route of the payments API         | `src/helpers/coreSupport.js`, its tests and fixtures  |

## Backend routes

The SDK calls the Tonder payments API (`GET /transactions/v1/business/config`, `POST /transactions/v1/process`, `GET /transactions/v1/{id}`, `payment_methods`, `vault-token`, `safetypay/banks[/{payment_type}]`, and with the flag on `customer` and `cards`, header `X-App-Origin: sdk/web-legacy`) and the legacy routes. It does not own them.

## Git

Branches `<prefix>/<TICKET>` from `develop`; commits `<type>: [<TICKET>] <short description>`; PR title `[<TICKET>] <short description>`.
