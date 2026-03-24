# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Build
npm run build          # Production build (minified, obfuscated)
npm run build-stage    # Stage build (non-minified)
npm run start          # Webpack dev server

# Code quality
npm run lint           # ESLint on src/**/*.js
npm run lint:fix       # ESLint with auto-fix
npm run format         # Prettier formatting
```

There are no unit test commands. Cypress is present in `cypress/` but not actively configured. Pre-commit hooks run `format` and `lint:fix` automatically via Husky + lint-staged.

## Architecture

This is a browser payment SDK that bundles to UMD format (`window.TonderSdk`) via Webpack. The output is `v1/bundle.min.js` (production) and `v1/bundle.js` (dev).

### Class Hierarchy

```
BaseInlineCheckout       — shared initialization, API calls, 3DS flow
├── InlineCheckout       — pre-built UI, renders full checkout HTML
└── LiteInlineCheckout   — headless; developer owns the UI
Checkout                 — legacy implementation (AES + postMessage)
ThreeDSHandler           — 3DS verification iframe/redirect flow
```

Public exports from `src/index.js`: `Checkout`, `InlineCheckout`, `LiteInlineCheckout`, and card validation utilities.

### Layer Responsibilities

- **`src/classes/`** — checkout business logic; `BaseInlineCheckout` contains the shared payment orchestration flow (customer registration, Skyflow tokenization, OpenPay device session, payment creation, 3DS handling)
- **`src/data/`** — API client layer; each file maps to one Tonder backend resource (cards, customers, orders, APMs, etc.)
- **`src/helpers/`** — `template.js` (114KB) generates all checkout HTML/CSS programmatically; `skyflow.js` wraps Skyflow card tokenization; `validations.js` has Luhn/CVV/expiry checks
- **`src/shared/`** — constants (API URLs per environment, message strings, HTML element IDs) and catalogs (APM metadata, card brand logos)

### Key Patterns

**API calls** all go through `src/shared/utils/apiFetch.js` (`fetchWithSignatureHeaders`) which adds HMAC signatures. Auth is `Authorization: Token {apiKey}`.

**Environments** are controlled by `mode` passed at construction (`production`, `sandbox`, `stage`, `development`). URLs are resolved in `src/shared/constants/tonderUrl.js`.

**Skyflow** tokenizes raw card data so card numbers never touch merchant servers. Returns a `skyflow_id` used for saved cards.

**3DS** flow is managed by `ThreeDSHandler` — it persists state to localStorage with a 20-minute expiry and renders an iframe or redirect for bank verification.

**APMs** (Mercado Pago, SPEI, Neosurf, SafetyPay, Paysafe, etc.) are catalog-driven with metadata in `src/shared/catalog/paymentMethodsCatalog.js` and identifiers in `src/shared/constants/paymentMethodAPM.js`.

**Production builds** apply `webpack-obfuscator` with control flow flattening and string array encoding — do not expect readable output in `v1/`.

### Prettier Config

100-character line width, double quotes, semicolons (see `.prettierrc`).
