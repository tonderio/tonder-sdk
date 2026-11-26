import { checkoutRouterError } from "../data/checkoutApi";
import {
  APPROVED_PAYMENT_STATUSES,
  OPEN_PAYMENT_STATUSES,
  isApmTypeAnswer,
} from "../shared/constants/paymentEngine";

const SPEI_TYPE = "SPEI";
const GUARDIAN_DECLINE_CODE = "FH01";
const DEFAULT_PROVIDER = "tonder";
const CARD_FIELDS = [
  "card_number",
  "cvv",
  "expiration_month",
  "expiration_year",
  "cardholder_name",
];

export function newRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

// The type goes as the merchant wrote it; the core reads only `apm_config` beside it. SPEI is
// the exception: the core's schema accepts the constant SPEI and no other member, so it goes
// upper case and alone.
const buildApmPaymentMethod = (type, apmConfig) =>
  isSpei(type)
    ? { type: SPEI_TYPE }
    : {
        type,
        ...(apmConfig && Object.keys(apmConfig).length > 0 ? { apm_config: apmConfig } : {}),
      };

function buildCardPaymentMethod(card, savedCardId) {
  // The caller decides by flow: a fresh collect also returns the new record's skyflow_id,
  // and the core reads `token` as a saved card.
  if (!savedCardId && !CARD_FIELDS.some(field => card?.[field] !== undefined)) {
    throw checkoutRouterError(
      toLegacyCheckoutError(400, {
        error: { message: "A saved card id or the collected card fields are required to pay." },
      }),
    );
  }
  return savedCardId
    ? { type: "CARD", token: savedCardId }
    : {
        type: "CARD",
        ...Object.fromEntries(CARD_FIELDS.map(field => [field, card[field] ?? ""])),
        // Only the core's BIN lookup reads it; the card is still charged from the field tokens.
        ...(card.skyflow_id ? { skyflow_id: card.skyflow_id } : {}),
      };
}

/**
 * Builds the core's `/process` body from what the legacy SDK sends to `orders`,
 * `business/<b>/payments` and `checkout-router`.
 */
export function buildCoreProcessBody({
  total,
  currency,
  reference,
  orderReference,
  firstName,
  lastName,
  email,
  phone,
  identification,
  browserInfo,
  card,
  savedCardId,
  paymentMethodType,
  apmConfig,
  returnUrl,
  metadata,
  billingAddress,
  items,
}) {
  const paymentMethod = paymentMethodType
    ? buildApmPaymentMethod(paymentMethodType, apmConfig)
    : buildCardPaymentMethod(card, savedCardId);
  return {
    operation_type: "payment",
    amount: Number(total),
    ...(currency ? { currency } : {}),
    client_reference: orderReference || reference,
    customer: {
      name: [firstName, lastName].filter(Boolean).join(" "),
      email,
      ...(phone ? { phone } : {}),
      ...(identification ? { identification } : {}),
    },
    payment_method: paymentMethod,
    ...(metadata !== undefined ? { metadata } : {}),
    return_url: returnUrl,
    ...(billingAddress ? { billing_address: billingAddress } : {}),
    ...(browserInfo ? { browser_info: browserInfo } : {}),
    ...(items ? { items } : {}),
  };
}

const isGuardianBlock = core => core.decline_code === GUARDIAN_DECLINE_CODE;

const toTransactionId = value =>
  typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;

// `core.id` is the transaction id (one per attempt with a method), which both routes accept;
// the payment that groups its transactions is `core.payment_id`.
function buildActions(core, { coreUrl }) {
  return [
    {
      name: "verify_transaction_status",
      url: `${coreUrl}/transactions/v1/${core.id}`,
      method: "GET",
    },
    {
      name: "refund_transaction",
      url: `${coreUrl}/transactions/v1/process`,
      method: "POST",
      body: { operation_type: "refund", original_transaction_id: core.id },
    },
  ];
}

// An APM may also answer the data to render its own page; the legacy answer carries it untouched.
const NEXT_ACTION_MEMBERS = ["redirect_to_url", "display_qr_code", "display_bank_transfer"];

function buildNextAction(core) {
  return Object.fromEntries(
    NEXT_ACTION_MEMBERS.filter(member => core.next_action?.[member]).map(member => [
      member,
      core.next_action[member],
    ]),
  );
}

// SPEI answers its CLABE and bank beside next_action, as the legacy route does. Only a SPEI
// answer carries them, and only the ones it has: nothing is invented, null included.
const SETTLEMENT_FIELDS = ["clabe", "bank_name"];

const isSpei = type => typeof type === "string" && type.toUpperCase() === SPEI_TYPE;

const buildSettlement = core =>
  isSpei(core.payment_method_type)
    ? Object.fromEntries(
        SETTLEMENT_FIELDS.filter(field => core[field] != null).map(field => [field, core[field]]),
      )
    : {};

function legacyBase(core, provider) {
  return {
    checkout_id: core.routing?.checkout_id,
    is_route_finished: !!core.routing?.is_route_finished,
    transaction_status: core.transaction_status,
    payment_id: core.payment_id,
    provider,
  };
}

function guardianBody(core, provider) {
  return {
    status: "200",
    message: core.decline_reason,
    ...legacyBase(core, provider),
    transaction_id: String(core.transaction_id),
    // The legacy Guardian body sends the amount as a float, not the core's four-decimal string.
    amount: Number(core.amount) || 0,
    currency: core.currency,
    psp_response: core.psp_response,
    decline_code: core.decline_code,
  };
}

function declinedBody(core, provider, ctx) {
  const hard = core.routing?.decline_type === "Hard";
  return {
    status: "404",
    message: hard ? "Hard decline" : core.decline_reason || "Transaction declined",
    psp_response: hard ? core.psp_response : (core.routing?.rejected_psp_responses ?? []),
    ...legacyBase(core, provider),
    transaction_id: toTransactionId(core.transaction_id),
    decline_code: core.decline_code ?? null,
    actions: buildActions(core, ctx),
  };
}

function approvedBody(core, provider, ctx) {
  return {
    status: "200",
    message: "Success",
    ...legacyBase(core, provider),
    transaction_id: toTransactionId(core.transaction_id),
    next_action: buildNextAction(core),
    ...buildSettlement(core),
    psp_response: core.psp_response,
    actions: buildActions(core, ctx),
  };
}

/**
 * Rebuilds the `checkout-router` body of a core answer. `ok` tells whether the
 * legacy route answered 2xx (the SDK resolves) or not (the SDK rejects with
 * `error.details`).
 */
export function toLegacyCheckoutResult(core, ctx) {
  const provider = core.provider || DEFAULT_PROVIDER;
  const charged =
    APPROVED_PAYMENT_STATUSES.includes(core.status) || OPEN_PAYMENT_STATUSES.includes(core.status);
  if (charged) return { ok: true, body: approvedBody(core, provider, ctx) };
  if (isGuardianBlock(core)) return { ok: true, body: guardianBody(core, provider) };
  return { ok: false, body: declinedBody(core, provider, ctx) };
}

const withoutUndefined = object =>
  Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined));

// Answered by the core under the monolith's own names and values; a null stays null.
const FIRST_PARTY_TRANSACTION_FIELDS = [
  "card_brand",
  "transaction_reference",
  "number_of_payment_attempts",
  "number_of_installments",
  "three_d_secure",
  "reason",
  "operation_date",
  "decline",
];

// The deposits service answers a SPEI verification in its own shapes: the amount as a number, the
// reference as text ("" when it has none) and the date as Python's UTC isoformat, with microseconds
// only when they are not zero.
const ISO_UTC = /^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.(\d+))?(?:Z|[+-]00:?00)?$/;

const toPythonIsoformat = value => {
  const match = typeof value === "string" && ISO_UTC.exec(value);
  if (!match) return value;
  const micros = (match[2] || "").slice(0, 6).padEnd(6, "0");
  return `${match[1]}${/^0+$/.test(micros) ? "" : `.${micros}`}+00:00`;
};

const toSpeiTransactionFields = core => ({
  amount: Number.isFinite(Number(core.amount)) ? Number(core.amount) : core.amount,
  transaction_reference: core.transaction_reference ?? "",
  ...("operation_date" in core ? { operation_date: toPythonIsoformat(core.operation_date) } : {}),
});

// A null answer stays null and a missing one stays missing, as the legacy route answers them.
const nestedOrNull = (value, build) =>
  value === undefined || value === null ? value : build(value);

const LEGACY_TRANSACTION_TYPES = { payment: "PAYMENT", refund: "REFUND" };

/**
 * Rebuilds, from the core's `GET /transactions/v1/{id}` answer, the transaction object the legacy
 * verify route returns (same names, types and values). Fields only the legacy back office holds
 * (fees, rates, taxes, Guardian data, the payment method object) are left out rather than invented.
 */
export function toLegacyTransaction(core) {
  const transaction = {
    id: toTransactionId(core.transaction_id),
    status: core.status,
    transaction_status: core.status,
    provider: core.provider || DEFAULT_PROVIDER,
    checkout_id: core.routing?.checkout_id,
    checkout: core.routing
      ? withoutUndefined({
          id: core.routing.checkout_id,
          is_route_finished: core.routing.is_route_finished,
        })
      : core.routing,
    amount: core.amount,
    currency: nestedOrNull(core.currency, code => ({ code })),
    currency_code: core.currency,
    transaction_type: LEGACY_TRANSACTION_TYPES[core.operation_type] || "PAYMENT",
    metadata: core.metadata,
    created: core.created_at,
    modified: core.updated_at,
    payment: nestedOrNull(core.payment_id, id => ({ id })),
    response: core.psp_response,
    is_apm: isApmTypeAnswer(core.payment_method_type),
  };
  FIRST_PARTY_TRANSACTION_FIELDS.forEach(field => {
    if (field in core) transaction[field] = core[field];
  });
  return withoutUndefined(
    isSpei(core.payment_method_type)
      ? { ...transaction, ...toSpeiTransactionFields(core) }
      : transaction,
  );
}

export function toLegacyCheckoutError(status, body) {
  if (status === 402) {
    return { status: "404", message: "Error", psp_response: [], is_route_finished: true };
  }
  const message = typeof body?.error?.message === "string" && body.error.message;
  return {
    status: String(status),
    message: message || "Error",
    psp_response: [],
    is_route_finished: false,
  };
}
