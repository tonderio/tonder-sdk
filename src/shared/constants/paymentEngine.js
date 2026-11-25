// The engine that charges a payment, chosen once per payment and never changed afterwards.
export const PAYMENT_ENGINE = Object.freeze({
  CORE: "core",
  LEGACY: "legacy",
});

// The alternative payment methods the core charges, compared in upper case: the core accepts any
// case (it stores and answers it upper case), so the code itself is always sent as the merchant wrote
// it. Any other method (an unknown code) stays on the legacy flow.
const CORE_APM_TYPES = Object.freeze([
  "OXXOPAY",
  "MERCADOPAGO",
  "SAFETYPAYCASH",
  "SAFETYPAYTRANSFER",
  "NEOSURF",
  "QR",
  "TRANSFER",
  "SPEI",
]);

export const isCoreApm = type => CORE_APM_TYPES.includes(type.toUpperCase());

// What the core answers as a transaction's method type: a card or Apple Pay is not an APM, any
// other type is, so a method the SDK does not list still reads as one.
export const isApmTypeAnswer = type =>
  !!type && !["CARD", "APPLE_PAY"].includes(type.toUpperCase());

export const CORE_APP_ORIGIN = "sdk/web-legacy";

// Statuses of a core payment that can still change; every other status is final.
export const OPEN_PAYMENT_STATUSES = Object.freeze(["Pending", "Processing"]);

// Final statuses of a core payment that was charged. Any status outside these two lists is
// treated as a failed payment, never as an approved one.
export const APPROVED_PAYMENT_STATUSES = Object.freeze(["Success", "Authorized"]);
