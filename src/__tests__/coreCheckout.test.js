import { describe, expect, it } from "vitest";
import {
  buildCoreProcessBody,
  toLegacyCheckoutError,
  toLegacyCheckoutResult,
  toLegacyTransaction,
} from "../helpers/coreCheckout";
import { CORE_HOST, coreDeclined, coreRedirect, coreSuccess } from "./fixtures";

const ctx = { coreUrl: CORE_HOST };

describe("buildCoreProcessBody", () => {
  const base = {
    total: "100",
    currency: "MXN",
    reference: "TNDR-ref",
    orderReference: "order-1",
    firstName: "Ana",
    lastName: "Lopez",
    email: "ana@example.com",
    phone: "5512345678",
    identification: { type: "CURP", number: "ABC123" },
    browserInfo: { javascript_enabled: true, language: "es-MX" },
    returnUrl: "https://shop.example/return",
    metadata: { order_id: 9, transaction_id: 3 },
    items: [{ name: "Shirt", quantity: 1 }],
  };

  it("maps a new card, the order reference, items and metadata", () => {
    const body = buildCoreProcessBody({
      ...base,
      card: { card_number: "t1", cvv: "t2", cardholder_name: "t3" },
    });
    expect(body).toEqual({
      operation_type: "payment",
      amount: 100,
      currency: "MXN",
      client_reference: "order-1",
      customer: {
        name: "Ana Lopez",
        email: "ana@example.com",
        phone: "5512345678",
        identification: { type: "CURP", number: "ABC123" },
      },
      browser_info: { javascript_enabled: true, language: "es-MX" },
      payment_method: {
        type: "CARD",
        card_number: "t1",
        cvv: "t2",
        expiration_month: "",
        expiration_year: "",
        cardholder_name: "t3",
      },
      metadata: { order_id: 9, transaction_id: 3 },
      return_url: "https://shop.example/return",
      items: [{ name: "Shirt", quantity: 1 }],
    });
  });

  it("sends the field tokens and the new record id of a fresh collect, never a token", () => {
    const body = buildCoreProcessBody({
      ...base,
      card: {
        card_number: "t1",
        cvv: "t2",
        expiration_month: "t3",
        expiration_year: "t4",
        cardholder_name: "t5",
        skyflow_id: "new-record-id",
      },
    });
    expect(body.payment_method).toEqual({
      type: "CARD",
      card_number: "t1",
      cvv: "t2",
      expiration_month: "t3",
      expiration_year: "t4",
      cardholder_name: "t5",
      skyflow_id: "new-record-id",
    });
    expect(body.payment_method).not.toHaveProperty("token");
  });

  it("sends field tokens, never a token, for a fresh collect without card_number", () => {
    const body = buildCoreProcessBody({
      ...base,
      card: { cvv: "t2", skyflow_id: "new-record-id" },
    });
    expect(body.payment_method).toEqual({
      type: "CARD",
      card_number: "",
      cvv: "t2",
      expiration_month: "",
      expiration_year: "",
      cardholder_name: "",
      skyflow_id: "new-record-id",
    });
  });

  it.each([
    ["no card at all", undefined],
    ["a collect that returned no card field", {}],
    ["only the new record id", { skyflow_id: "new-record-id" }],
  ])("rejects with the checkout-router error shape for %s", (_, card) => {
    let error;
    try {
      buildCoreProcessBody({ ...base, card });
    } catch (e) {
      error = e;
    }
    expect(error.message).toBe("Failed to start checkout router");
    expect(error.details).toEqual({
      status: "400",
      message: "A saved card id or the collected card fields are required to pay.",
      psp_response: [],
      is_route_finished: false,
    });
  });

  it("never sends the record id of a saved card next to its token", () => {
    const body = buildCoreProcessBody({
      ...base,
      card: { skyflow_id: "sky-1" },
      savedCardId: "sky-1",
    });
    expect(body.payment_method).toEqual({ type: "CARD", token: "sky-1" });
  });

  it("sends an empty string for a field token the collect did not return", () => {
    const body = buildCoreProcessBody({ ...base, card: { card_number: "t1", cvv: "t2" } });
    expect(body.payment_method).toEqual({
      type: "CARD",
      card_number: "t1",
      cvv: "t2",
      expiration_month: "",
      expiration_year: "",
      cardholder_name: "",
    });
  });

  it("sends a saved card as a token and falls back to the business reference", () => {
    const body = buildCoreProcessBody({
      ...base,
      orderReference: undefined,
      savedCardId: "sky-1",
      billingAddress: { city: "CDMX" },
    });
    expect(body.payment_method).toEqual({ type: "CARD", token: "sky-1" });
    expect(body.client_reference).toBe("TNDR-ref");
    expect(body.billing_address).toEqual({ city: "CDMX" });
  });

  it("omits phone, identification and browser info when there are none", () => {
    const body = buildCoreProcessBody({
      ...base,
      phone: undefined,
      identification: undefined,
      browserInfo: undefined,
      savedCardId: "sky-1",
    });
    expect(body.customer).toEqual({ name: "Ana Lopez", email: "ana@example.com" });
    expect(body).not.toHaveProperty("browser_info");
  });
});

describe("toLegacyCheckoutResult", () => {
  it("rebuilds the approved checkout-router body", () => {
    const { ok, body } = toLegacyCheckoutResult(coreSuccess(), ctx);
    expect(ok).toBe(true);
    expect(body).toEqual({
      status: "200",
      message: "Success",
      checkout_id: "route-1",
      is_route_finished: false,
      transaction_status: "Success",
      transaction_id: 555,
      payment_id: 77,
      provider: "tonder",
      next_action: {},
      psp_response: { approved: true },
      // Both actions use the transaction id (core.id), not the payment_id.
      actions: [
        {
          name: "verify_transaction_status",
          url: `${CORE_HOST}/transactions/v1/0190aaaa-0000-7000-8000-000000000001`,
          method: "GET",
        },
        {
          name: "refund_transaction",
          url: `${CORE_HOST}/transactions/v1/process`,
          method: "POST",
          body: {
            operation_type: "refund",
            original_transaction_id: "0190aaaa-0000-7000-8000-000000000001",
          },
        },
      ],
    });
  });

  it("keeps the 3DS redirect in next_action", () => {
    const { ok, body } = toLegacyCheckoutResult(coreRedirect(), ctx);
    expect(ok).toBe(true);
    expect(body.transaction_status).toBe("Pending");
    expect(body.next_action).toEqual({
      redirect_to_url: {
        url: "https://payflow.example/3ds#session=abc",
        return_url: "https://shop.example/return?tndr_payment_id=77",
        verify_transaction_status_url: "/transactions/v1/0190aaaa",
      },
    });
  });

  it("rejects a soft decline with the list of rejected responses", () => {
    const { ok, body } = toLegacyCheckoutResult(coreDeclined(), ctx);
    expect(ok).toBe(false);
    expect(body).toMatchObject({
      status: "404",
      message: "Do not honor",
      psp_response: [{ code: "05" }, { code: "51" }],
      checkout_id: "route-1",
      is_route_finished: true,
      transaction_status: "Declined",
      transaction_id: 555,
      payment_id: 77,
      provider: "tonder",
      decline_code: "GS01",
    });
    expect(body.actions).toHaveLength(2);
  });

  it("rejects a hard decline with 'Hard decline' and the single response", () => {
    const hard = coreDeclined();
    hard.routing.decline_type = "Hard";
    const { ok, body } = toLegacyCheckoutResult(hard, ctx);
    expect(ok).toBe(false);
    expect(body.message).toBe("Hard decline");
    expect(body.psp_response).toEqual({ code: "51" });
  });

  it("resolves a Guardian block with the 200 body and no actions", () => {
    const guardian = coreDeclined({
      acq: "guardian",
      decline_code: "FH01",
      decline_reason: "High risk transaction blocked",
      transaction_id: "guardian-row-1",
    });
    const { ok, body } = toLegacyCheckoutResult(guardian, ctx);
    expect(ok).toBe(true);
    expect(body).toEqual({
      status: "200",
      message: "High risk transaction blocked",
      checkout_id: "route-1",
      is_route_finished: true,
      transaction_status: "Declined",
      transaction_id: "guardian-row-1",
      payment_id: 77,
      provider: "tonder",
      amount: 100,
      currency: "MXN",
      psp_response: { code: "51" },
      decline_code: "FH01",
    });
  });
});

describe("toLegacyCheckoutResult statuses", () => {
  it.each(["Success", "Authorized", "Pending", "Processing"])("approves %s", status => {
    const { ok, body } = toLegacyCheckoutResult(
      coreSuccess({ status, transaction_status: status }),
      ctx,
    );
    expect(ok).toBe(true);
    expect(body.status).toBe("200");
  });

  it.each(["Cancelled", "Expired", "Voided", "Error", "SomethingNew", undefined])(
    "never approves %s",
    status => {
      const { ok, body } = toLegacyCheckoutResult(coreSuccess({ status }), ctx);
      expect(ok).toBe(false);
      expect(body.status).toBe("404");
      expect(body.message).not.toBe("Success");
    },
  );
});

describe("toLegacyCheckoutError", () => {
  it("maps a route that ended with no registered transaction to the legacy error body", () => {
    expect(
      toLegacyCheckoutError(402, { error: { code: "payment_declined" }, status_code: 402 }),
    ).toEqual({ status: "404", message: "Error", psp_response: [], is_route_finished: true });
  });

  it("builds the checkout-router error shape from any other core error", () => {
    expect(
      toLegacyCheckoutError(400, { error: { code: "invalid_request", message: "Bad amount" } }),
    ).toEqual({ status: "400", message: "Bad amount", psp_response: [], is_route_finished: false });
  });

  it("falls back to the generic message when the core sends no readable body", () => {
    expect(toLegacyCheckoutError(503, undefined)).toEqual({
      status: "503",
      message: "Error",
      psp_response: [],
      is_route_finished: false,
    });
  });
});

describe("toLegacyTransaction", () => {
  const core = overrides =>
    coreSuccess({
      amount: "100.0000",
      currency: "MXN",
      created_at: "2026-11-17T10:00:00Z",
      updated_at: "2026-11-17T10:00:05Z",
      ...overrides,
    });

  it("rebuilds the legacy transaction object of a Success", () => {
    expect(toLegacyTransaction(core())).toEqual({
      id: 555,
      status: "Success",
      transaction_status: "Success",
      provider: "tonder",
      checkout_id: "route-1",
      checkout: { id: "route-1", is_route_finished: false },
      amount: "100.0000",
      currency: { code: "MXN" },
      currency_code: "MXN",
      transaction_type: "PAYMENT",
      metadata: { order_id: 9 },
      created: "2026-11-17T10:00:00Z",
      modified: "2026-11-17T10:00:05Z",
      payment: { id: 77 },
      response: { approved: true },
      is_apm: false,
    });
  });

  it("maps the first-party fields of the core answer 1:1, keeping nulls", () => {
    const fields = {
      card_brand: "VISA",
      transaction_reference: "TNDR-1",
      number_of_payment_attempts: 2,
      number_of_installments: 1,
      three_d_secure: { eci: "05" },
      reason: null,
      operation_date: "2026-11-17T10:00:01.123456Z",
      decline: { error_type: "Soft" },
    };
    expect(toLegacyTransaction(core(fields))).toMatchObject(fields);
    expect(toLegacyTransaction(core({ decline: null }))).toHaveProperty("decline", null);
  });

  it("keeps a null answer as null and omits what the core did not answer", () => {
    const transaction = toLegacyTransaction(
      core({ metadata: null, currency: null, payment_id: null, psp_response: null }),
    );
    expect(transaction).toMatchObject({
      metadata: null,
      currency: null,
      currency_code: null,
      payment: null,
      response: null,
    });
    const absent = toLegacyTransaction({ id: "x", status: "Success", transaction_id: "7" });
    ["metadata", "currency", "currency_code", "payment", "response"].forEach(key =>
      expect(absent).not.toHaveProperty(key),
    );
  });

  it("maps the operation type to the monolith's stored transaction type", () => {
    expect(toLegacyTransaction(core({ operation_type: "payment" })).transaction_type).toBe(
      "PAYMENT",
    );
    expect(toLegacyTransaction(core({ operation_type: "refund" })).transaction_type).toBe("REFUND");
  });

  it("keeps a Declined status and never builds a checkout-router body", () => {
    const transaction = toLegacyTransaction(
      core({ status: "Declined", transaction_status: "Declined", psp_response: { code: "51" } }),
    );
    expect(transaction).toMatchObject({
      status: "Declined",
      transaction_status: "Declined",
      response: { code: "51" },
    });
    ["message", "actions", "next_action", "is_route_finished", "psp_response"].forEach(key =>
      expect(transaction).not.toHaveProperty(key),
    );
  });

  it("keeps a Pending status", () => {
    expect(toLegacyTransaction(core({ status: "Pending" }))).toMatchObject({
      status: "Pending",
      transaction_status: "Pending",
    });
  });

  it("falls back to tonder as the provider and omits what the core does not answer", () => {
    const transaction = toLegacyTransaction({ id: "x", status: "Success", transaction_id: "7" });
    expect(transaction).toEqual({
      id: 7,
      status: "Success",
      transaction_status: "Success",
      provider: "tonder",
      transaction_type: "PAYMENT",
      is_apm: false,
    });
  });
});
