import { checkoutRouterError } from "../data/checkoutApi";
import {
  APPROVED_PAYMENT_STATUSES,
  OPEN_PAYMENT_STATUSES,
} from "../shared/constants/paymentEngine";

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
  returnUrl,
  metadata,
  billingAddress,
  items,
}) {
  // The caller decides by flow: a fresh collect also returns the new record's skyflow_id,
  // and the core reads `token` as a saved card.
  if (!savedCardId && !CARD_FIELDS.some(field => card?.[field] !== undefined)) {
    throw checkoutRouterError(
      toLegacyCheckoutError(400, {
        error: { message: "A saved card id or the collected card fields are required to pay." },
      }),
    );
  }
  const paymentMethod = savedCardId
    ? { type: "CARD", token: savedCardId }
    : {
        type: "CARD",
        ...Object.fromEntries(CARD_FIELDS.map(field => [field, card[field] ?? ""])),
      };
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

function buildNextAction(core) {
  return core.next_action?.redirect_to_url
    ? { redirect_to_url: core.next_action.redirect_to_url }
    : {};
}

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
    amount: core.amount,
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
