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

// `id` is the transaction id (one per attempt with a method); `payment_id` groups the payment.
export const coreSuccess = (overrides = {}) => ({
  id: "0190aaaa-0000-7000-8000-000000000001",
  operation_type: "payment",
  status: "Success",
  amount: "100.0000",
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

// An APM payment is Pending with the buyer's page; it has no routing cycle or card brand.
export const coreApmPending = (overrides = {}) =>
  coreSuccess({
    status: "Pending",
    transaction_status: "Pending",
    acq: "apms",
    // An APM is one step with no route: the core finishes it at once and the routing id is the id.
    routing: {
      checkout_id: "0190aaaa-0000-7000-8000-000000000001",
      is_route_finished: true,
      decline_type: null,
      rejected_psp_responses: [],
    },
    next_action: {
      redirect_to_url: {
        url: "https://payflow.example/oxxo-pay?token=display",
        return_url: "https://shop.example/return?tndr_payment_id=77",
        verify_transaction_status_url: "/transactions/v1/0190aaaa",
      },
    },
    psp_response: {},
    ...overrides,
  });

export const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status <= 299,
  status,
  statusText: "",
  json: async () => body,
});

// Answers of the core's SDK support routes (its public contract), not the monolith's bodies.
export const coreCustomer = (overrides = {}) => ({
  customer_id: 5,
  email: "ana@example.com",
  first_name: "Ana",
  last_name: "Lopez",
  auth_token: "customer-token",
  auth_token_expires_at: "2026-11-20T12:00:00Z",
  ...overrides,
});

export const coreCard = (overrides = {}) => ({
  id: "sky-1",
  card_number: "XXXX-XXXX-XXXX-4242",
  expiration_month: "12",
  expiration_year: "29",
  card_scheme: "VISA",
  subscription_id: null,
  ...overrides,
});

export const coreError = (code, message = "A sentence.", type = code, details) => ({
  error: { code, message, type, ...(details ? { details } : {}) },
  request_id: "req-1",
});

export const coreBank = (overrides = {}) => ({
  bank_id: 41,
  code: "BBVA",
  name: "BBVA",
  payment_type: "transfer",
  priority: 1,
  logo_url: "https://cdn.example/bbva.png",
  country_name: "México",
  channels: ["OL"],
  limits: { min: 1, max: 1000 },
  currency: "MXN",
  locations_url: null,
  ...overrides,
});

export const corePaymentMethod = (overrides = {}) => ({
  id: "0190bbbb-0000-7000-8000-000000000001",
  payment_method: "SPEI",
  category: "Bank transfer",
  acquirer: "stp",
  status: "active",
  priority: 2,
  unavailable_countries: [],
  ...overrides,
});
