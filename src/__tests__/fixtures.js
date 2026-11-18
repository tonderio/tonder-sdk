export const API_KEY = "test-api-key";
export const CORE_HOST = "https://api-stage.tonder.io";

export const businessConfig = (overrides = {}) => ({
  business: { pk: 12, name: "Shop" },
  reference: "TNDR-ref",
  vault_id: "vault",
  vault_url: "https://vault.example",
  mercado_pago: { active: false },
  core_payments_enabled: true,
  ...overrides,
});

export const coreSuccess = (overrides = {}) => ({
  id: "0190aaaa-0000-7000-8000-000000000001",
  operation_type: "payment",
  status: "Success",
  amount: 100,
  currency: "MXN",
  country: "MX",
  client_reference: "order-1",
  metadata: { order_id: 9 },
  provider: "tonder",
  created_at: "2026-11-17T10:00:00Z",
  status_code: 201,
  next_action: { verify_transaction_status_url: "/transactions/v1/0190aaaa" },
  payment_id: 77,
  transaction_id: "555",
  routing: {
    checkout_id: "route-1",
    is_route_finished: false,
    decline_type: null,
    rejected_psp_responses: [],
  },
  acq: "kushki",
  transaction_status: "Success",
  psp_response: { approved: true },
  ...overrides,
});

export const coreDeclined = (overrides = {}) =>
  coreSuccess({
    status: "Declined",
    status_code: 200,
    transaction_status: "Declined",
    next_action: undefined,
    decline_code: "GS01",
    decline_reason: "Do not honor",
    psp_response: { code: "51" },
    routing: {
      checkout_id: "route-1",
      is_route_finished: true,
      decline_type: "Soft",
      rejected_psp_responses: [{ code: "05" }, { code: "51" }],
    },
    ...overrides,
  });

export const coreRedirect = () =>
  coreSuccess({
    status: "Pending",
    transaction_status: "Pending",
    next_action: {
      redirect_to_url: {
        url: "https://payflow.example/3ds#session=abc",
        return_url: "https://shop.example/return?tndr_payment_id=77",
        verify_transaction_status_url: "/transactions/v1/0190aaaa",
      },
    },
    psp_response: {},
  });

export const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status <= 299,
  status,
  statusText: "",
  json: async () => body,
});
