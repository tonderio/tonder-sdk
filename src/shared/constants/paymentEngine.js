// The engine that charges a payment, chosen once per payment and never changed afterwards.
export const PAYMENT_ENGINE = Object.freeze({
  CORE: "core",
  LEGACY: "legacy",
});

export const CORE_APP_ORIGIN = "sdk/web-legacy";

// Statuses of a core payment that can still change; every other status is final.
export const OPEN_PAYMENT_STATUSES = Object.freeze(["Pending", "Processing"]);
