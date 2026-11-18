# AGENTS.md

Guide for agents and people working in this repository, the browser payment SDK that bundles to UMD
(`window.TonderSdk`). The integration guide for merchants is `README.md`; this file is how to work here.

## Commands

| Command                             | What it does                                                           |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `npm run build`                     | Production build to `v2/bundle.min.js` (minified, obfuscated)          |
| `npm run build-stage`               | Non-minified build to `v2/bundle.js`                                   |
| `npm run start`                     | Webpack dev server                                                     |
| `npm run lint` / `npm run lint:fix` | ESLint on `src/**/*.js`                                                |
| `npm run format`                    | Prettier on the whole repository                                       |
| `npm run check:no-eval`             | Fails when the built `v2/bundle.min.js` holds a string-evaluation sink |

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
- `src/data/`: one file per backend resource (cards, customers, orders, APMs).
- `src/helpers/`: `template.js` builds all checkout HTML and CSS; `skyflow.js` wraps card tokenization; `validations.js` has the card checks.
- `src/shared/`: constants (URLs per environment, messages, element ids) and catalogs (APMs, card logos).

## Conventions

- Every API call goes through `src/shared/utils/apiFetch.js` (`fetchWithSignatureHeaders`); auth is `Authorization: Token {apiKey}`.
- `mode` (`production`, `sandbox`, `stage`, `development`) selects the URLs, resolved in `src/shared/constants/tonderUrl.js`.
- Skyflow tokenizes card data in the browser, so card numbers never reach merchant servers.
- APMs are catalog-driven: metadata in `src/shared/catalog/paymentMethodsCatalog.js`, identifiers in `src/shared/constants/paymentMethodAPM.js`.
- Style: 100-character lines, double quotes, semicolons (`.prettierrc`).
- Docs change with the code, in the same commit: use the table in When you change X, update Y; a change that leaves a doc stale is incomplete.

## Gotchas

- Production builds apply `webpack-obfuscator`; the output in `v2/` is not readable.
- 3DS state lives in `localStorage` (`verify_transaction_status`) for 20 minutes.
- The pre-commit hook runs `npx lint-staged` (Prettier then `lint:fix`) through Husky; `npm ci --ignore-scripts` does not install it.
- `v1/` and `v2/` bundles are committed; a release rebuilds them, a feature commit does not.

## When you change X, update Y

| You change                                  | Also update              |
| ------------------------------------------- | ------------------------ |
| A command, script or tooling                | `AGENTS.md` Commands     |
| Layout, a convention or a gotcha            | `AGENTS.md`              |
| Public options, results, callbacks or flows | `README.md` and `types/` |

## Git

Branches `<prefix>/<TICKET>` from `develop`; commits `<type>: [<TICKET>] <short description>`; PR title `[<TICKET>] <short description>`. Push, PR and merge need the owner's authorisation.
