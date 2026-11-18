import { describe, expect, it } from "vitest";
import {
  buildCoreProcessBody,
  toLegacyCheckoutError,
  toLegacyCheckoutResult,
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
      payment_method: { type: "CARD", card_number: "t1", cvv: "t2", cardholder_name: "t3" },
      metadata: { order_id: 9, transaction_id: 3 },
      return_url: "https://shop.example/return",
      items: [{ name: "Shirt", quantity: 1 }],
    });
  });

  it("sends a saved card as a token and falls back to the business reference", () => {
    const body = buildCoreProcessBody({
      ...base,
      orderReference: undefined,
      card: { skyflow_id: "sky-1" },
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
      card: { skyflow_id: "sky-1" },
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

describe("toLegacyCheckoutError", () => {
  it("maps a route that ended with no registered transaction to the legacy error body", () => {
    expect(
      toLegacyCheckoutError(402, { error: { code: "payment_declined" }, status_code: 402 }),
    ).toEqual({ status: "404", message: "Error", psp_response: [], is_route_finished: true });
  });

  it("keeps any other core error body", () => {
    const body = { error: { code: "service_unavailable" }, status_code: 502 };
    expect(toLegacyCheckoutError(502, body)).toEqual(body);
  });
});
