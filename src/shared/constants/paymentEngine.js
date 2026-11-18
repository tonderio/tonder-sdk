// The engine that charges a payment, chosen once per payment and never changed afterwards.
export const PAYMENT_ENGINE = Object.freeze({
  CORE: "core",
  LEGACY: "legacy",
});

export const CORE_APP_ORIGIN = "sdk/web-legacy";

// Statuses of a core payment that can still change; every other status is final.
export const OPEN_PAYMENT_STATUSES = Object.freeze(["Pending", "Processing"]);

// Final statuses of a core payment that was charged. Any status outside these two lists is
// treated as a failed payment, never as an approved one.
export const APPROVED_PAYMENT_STATUSES = Object.freeze(["Success", "Authorized"]);
