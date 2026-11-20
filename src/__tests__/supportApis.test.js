import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiteInlineCheckout } from "../classes/LiteInlineCheckout";
import { fetchCustomerCards, saveCustomerCard, removeCustomerCard } from "../data/cardApi";
import { fetchCustomerAPMs, fetchSafetyPayBanks, fetchSafetyPayBanksByType } from "../data/apmApi";
import { getSkyflowTokens } from "../helpers/skyflow";
import {
  API_KEY,
  CORE_HOST,
  businessConfig,
  coreBank,
  coreCard,
  coreCustomer,
  coreError,
  corePaymentMethod,
  jsonResponse,
} from "./fixtures";

const MONOLITH = "https://stage.tonder.io";
const CORE = `${CORE_HOST}/transactions`;
const SECURE = "secure-token";
const CUSTOMER_TOKEN = "customer-token";
const CARDS = { user_id: 5, cards: [] };
const CORE_CARDS = { customer_id: 5, data: [] };

let routes;
let calls;

const stubFetch = () => {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, options = {}) => {
      calls.push({ url, options, body: options.body ? JSON.parse(options.body) : undefined });
      const route = routes.find(([method, match]) => {
        return (options.method || "GET") === method && url.includes(match);
      });
      if (!route) throw new Error(`unexpected request: ${url}`);
      return route[2];
    }),
  );
};

const start = async ({ flag }) => {
  routes = [
    [
      "GET",
      "/transactions/v1/business/config",
      jsonResponse(businessConfig({ core_payments_enabled: flag })),
    ],
    ["POST", "/transactions/v1/customer", jsonResponse(coreCustomer(), 201)],
    ["POST", "/api/v1/customer/", jsonResponse({ id: 5, auth_token: CUSTOMER_TOKEN }, 201)],
    ["GET", "/transactions/v1/cards", jsonResponse(CORE_CARDS)],
    ["GET", "/api/v1/business/12/cards/", jsonResponse(CARDS)],
    ["DELETE", "/transactions/v1/cards/sky-1", jsonResponse(undefined, 204)],
    ["DELETE", "/api/v1/business/12/cards/sky-1", jsonResponse(undefined, 204)],
    ["GET", "/transactions/v1/payment_methods", jsonResponse({ data: [] })],
  ];
  stubFetch();
  const checkout = new LiteInlineCheckout({ apiKey: API_KEY, mode: "stage", returnUrl: "r" });
  checkout.configureCheckout({ customer: { email: "ana@example.com" }, secureToken: SECURE });
  await checkout.injectCheckout();
  calls.length = 0;
  return checkout;
};

const calledUrls = () => calls.map(call => call.url);
const monolithCalls = () => calledUrls().filter(url => url.startsWith(MONOLITH));

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("customer and saved cards follow core_payments_enabled", () => {
  describe("flag ON", () => {
    it("lists the cards on the core with the secure token and the customer token only", async () => {
      const checkout = await start({ flag: true });

      await checkout.getCustomerCards();

      expect(calledUrls()).toEqual([`${CORE}/v1/customer`, `${CORE}/v1/cards`]);
      const { options } = calls[1];
      expect(options.method).toBe("GET");
      expect(options.headers.Authorization).toBe(`Bearer ${SECURE}`);
      expect(options.headers["User-Token"]).toBe(CUSTOMER_TOKEN);
      expect(options.headers).not.toHaveProperty("X-App-Origin");
    });

    it("registers the customer on the core with the API key and the same body", async () => {
      const checkout = await start({ flag: true });

      await checkout.getCustomerCards();

      const [customer] = calls;
      expect(customer.options.headers.Authorization).toBe(`Token ${API_KEY}`);
      expect(customer.options.headers["X-App-Origin"]).toBe("sdk/web-legacy");
      expect(customer.body).toMatchObject({ email: "ana@example.com" });
    });

    it("removes a card on the core by its skyflow id", async () => {
      const checkout = await start({ flag: true });

      await checkout.removeCustomerCard("sky-1");

      expect(calledUrls()).toEqual([`${CORE}/v1/customer`, `${CORE}/v1/cards/sky-1`]);
      expect(calls[1].options.method).toBe("DELETE");
      expect(calls[1].options.headers.Authorization).toBe(`Bearer ${SECURE}`);
      expect(calls[1].options.headers["User-Token"]).toBe(CUSTOMER_TOKEN);
    });
  });

  describe("flag OFF", () => {
    it("keeps the customer and the saved cards on the monolith, unchanged", async () => {
      const checkout = await start({ flag: false });

      await checkout.getCustomerCards();
      await checkout.removeCustomerCard("sky-1");

      expect(calledUrls()).toEqual([
        `${MONOLITH}/api/v1/customer/`,
        `${MONOLITH}/api/v1/business/12/cards/`,
        `${MONOLITH}/api/v1/business/12/cards/sky-1`,
      ]);
      expect(calls[1].options.headers.Authorization).toBe(`Bearer ${SECURE}`);
      expect(calls[0].options.headers.Authorization).toBe(`Token ${API_KEY}`);
      expect(calls[0].options.headers).not.toHaveProperty("X-App-Origin");
    });
  });

  describe("adding a card", () => {
    const run = core =>
      saveCustomerCard(
        {},
        core ? CORE_HOST : MONOLITH,
        CUSTOMER_TOKEN,
        SECURE,
        12,
        { skyflow_id: "sky-1" },
        core,
      );

    it("posts to the core cards route on the core", async () => {
      routes = [["POST", "/transactions/v1/cards", jsonResponse({ skyflow_id: "sky-1" }, 201)]];
      stubFetch();

      await run(true);

      expect(calls[0].url).toBe(`${CORE}/v1/cards`);
      expect(calls[0].body).toEqual({ skyflow_id: "sky-1" });
      expect(calls[0].options.headers.Authorization).toBe(`Bearer ${SECURE}`);
      expect(calls[0].options.headers["User-Token"]).toBe(CUSTOMER_TOKEN);
    });

    it("posts to the monolith business route with the flag OFF", async () => {
      routes = [["POST", "/api/v1/business/12/cards/", jsonResponse({ skyflow_id: "sky-1" }, 201)]];
      stubFetch();

      await run(false);

      expect(calls[0].url).toBe(`${MONOLITH}/api/v1/business/12/cards/`);
    });
  });

  it("removes with the legacy path when core is not requested", async () => {
    routes = [["DELETE", "/api/v1/business/12/cards/sky-1", jsonResponse(undefined, 204)]];
    stubFetch();

    await removeCustomerCard({}, MONOLITH, CUSTOMER_TOKEN, SECURE, "sky-1", 12);

    expect(calls[0].url).toBe(`${MONOLITH}/api/v1/business/12/cards/sky-1`);
  });
});

describe("a payment that ends on the monolith with the flag ON", () => {
  it("places the order with the monolith customer token, not the core one", async () => {
    const checkout = await start({ flag: true });
    routes.unshift([
      "POST",
      "/api/v1/customer/",
      jsonResponse({ id: 5, auth_token: "monolith-token" }, 201),
    ]);
    routes.push(
      ["POST", "/api/v1/orders/", jsonResponse({ id: 31 }, 201)],
      ["POST", "/payments/", jsonResponse({ pk: 77 }, 201)],
      ["POST", "/api/v1/checkout-router/", jsonResponse({ status: "200" }, 201)],
    );

    await checkout.payment({
      customer: { firstName: "Ana", lastName: "Lopez", email: "ana@example.com" },
      cart: { total: "100", items: [{ name: "Shirt", quantity: 1 }] },
      currency: "MXN",
      payment_method: "Spei",
    });

    const monolithCustomer = calls.find(call => call.url === `${MONOLITH}/api/v1/customer/`);
    expect(monolithCustomer.body).toMatchObject({ email: "ana@example.com" });
    expect(monolithCustomer.options.headers.Authorization).toBe(`Token ${API_KEY}`);
    const order = calls.find(call => call.url === `${MONOLITH}/api/v1/orders/`);
    expect(order.body.client).toBe("monolith-token");
  });

  it("does not register a second customer on the monolith with the flag OFF", async () => {
    const checkout = await start({ flag: false });
    routes.push(
      ["POST", "/api/v1/orders/", jsonResponse({ id: 31 }, 201)],
      ["POST", "/payments/", jsonResponse({ pk: 77 }, 201)],
      ["POST", "/api/v1/checkout-router/", jsonResponse({ status: "200" }, 201)],
    );

    await checkout.payment({
      customer: { email: "ana@example.com" },
      cart: { total: "100", items: [] },
      currency: "MXN",
      payment_method: "Spei",
    });

    expect(calledUrls().filter(url => url.endsWith("/api/v1/customer/"))).toHaveLength(1);
    const order = calls.find(call => call.url === `${MONOLITH}/api/v1/orders/`);
    expect(order.body.client).toBe(CUSTOMER_TOKEN);
  });
});

describe("payment methods, SafetyPay banks and vault token always go to the core", () => {
  it.each([true, false])("lists payment methods on the core with the flag %s", async flag => {
    const checkout = await start({ flag });

    await checkout.getCustomerPaymentMethods();

    expect(calledUrls()).toEqual([`${CORE}/v1/payment_methods?status=active&pagesize=10000`]);
    expect(calls[0].options.headers.Authorization).toBe(`Token ${API_KEY}`);
    expect(calls[0].options.headers["X-App-Origin"]).toBe("sdk/web-legacy");
    expect(monolithCalls()).toEqual([]);
  });

  it("reads the SafetyPay banks without the business key in the path", async () => {
    routes = [
      ["GET", "/transactions/v1/safetypay/banks/cash", jsonResponse({ data: [] })],
      ["GET", "/transactions/v1/safetypay/banks", jsonResponse({ data: [] })],
    ];
    stubFetch();

    await fetchSafetyPayBanks(CORE_HOST, API_KEY);
    await fetchSafetyPayBanksByType(CORE_HOST, API_KEY, "cash");

    expect(calledUrls()).toEqual([`${CORE}/v1/safetypay/banks`, `${CORE}/v1/safetypay/banks/cash`]);
    calls.forEach(call => {
      expect(call.options.headers.Authorization).toBe(`Token ${API_KEY}`);
      expect(call.options.headers["X-App-Origin"]).toBe("sdk/web-legacy");
    });
  });

  it("mints the vault bearer on the core", async () => {
    routes = [["GET", "/transactions/v1/vault-token", jsonResponse({ token: "vault-bearer" })]];
    stubFetch();
    let getBearerToken;
    globalThis.Skyflow.init = vi.fn(options => {
      getBearerToken = options.getBearerToken;
      return {
        container: () => ({ collect: async () => ({ records: [{ fields: {} }] }) }),
      };
    });

    await getSkyflowTokens({
      coreUrl: CORE_HOST,
      apiKey: API_KEY,
      vault_id: "vault",
      vault_url: "https://vault.example",
      data: {},
    });

    expect(await getBearerToken()).toBe("vault-bearer");
    expect(calledUrls()).toEqual([`${CORE}/v1/vault-token`]);
    expect(calls[0].options.headers.Authorization).toBe(`Token ${API_KEY}`);
    delete globalThis.Skyflow.init;
  });
});

describe("the core's answers are mapped onto the merchant-facing results", () => {
  const catchError = promise =>
    promise.then(
      () => {
        throw new Error("expected a rejection");
      },
      error => error,
    );

  it("returns the customer as the monolith does: id and auth_token", async () => {
    const checkout = await start({ flag: true });

    const customer = await checkout._getCustomer({ email: "ana@example.com" });

    expect(customer).toMatchObject({
      id: 5,
      auth_token: "customer-token",
      email: "ana@example.com",
      first_name: "Ana",
      last_name: "Lopez",
    });
  });

  it.each([
    ["customer_email_not_allowed", 422],
    ["invalid_request", 400],
    ["dependency_unavailable", 503],
  ])("rejects a customer %s with its status and message", async (code, status) => {
    const checkout = await start({ flag: true });
    routes.unshift([
      "POST",
      "/transactions/v1/customer",
      jsonResponse(coreError(code, "Nope."), status),
    ]);

    const error = await catchError(checkout._getCustomer({ email: "x" }));

    expect(error.message).toContain("Nope.");
    expect(error.status).toBe(status);
    expect(error.body.error.code).toBe(code);
  });

  it("maps the cards list to user_id and cards[].fields", async () => {
    const checkout = await start({ flag: true });
    routes.unshift([
      "GET",
      "/transactions/v1/cards",
      jsonResponse({
        customer_id: 5,
        data: [coreCard(), coreCard({ id: "sky-2", card_scheme: "MC" })],
      }),
    ]);

    const response = await checkout.getCustomerCards();

    expect(response.user_id).toBe(5);
    expect(response.cards).toHaveLength(2);
    expect(response.cards[0].fields).toEqual({
      skyflow_id: "sky-1",
      card_number: "XXXX-XXXX-XXXX-4242",
      expiration_month: "12",
      expiration_year: "29",
      card_scheme: "VISA",
      subscription_id: null,
    });
    expect(response.cards[1].fields.skyflow_id).toBe("sky-2");
    expect(response.cards[0].icon).toBeDefined();
  });

  it("keeps the soft Unauthorized answer of the list for invalid_customer_token", async () => {
    routes = [
      ["GET", "/transactions/v1/cards", jsonResponse(coreError("invalid_customer_token"), 401)],
    ];
    stubFetch();

    expect(await fetchCustomerCards({}, CORE_HOST, CUSTOMER_TOKEN, SECURE, 12, null, true)).toEqual(
      {
        code: 401,
        body: {},
        name: "",
        message: "Unauthorized",
      },
    );
  });

  describe("adding a card", () => {
    const add = () =>
      saveCustomerCard({}, CORE_HOST, CUSTOMER_TOKEN, SECURE, 12, { skyflow_id: "sky-1" }, true);

    it("maps the saved card to skyflow_id and user_id", async () => {
      routes = [
        [
          "POST",
          "/transactions/v1/cards",
          jsonResponse(
            { id: "sky-1", customer_id: 5, subscription_id: null, card_scheme: "VISA" },
            201,
          ),
        ],
      ];
      stubFetch();

      expect(await add()).toEqual({ skyflow_id: "sky-1", user_id: 5 });
    });

    it("answers the monolith's soft PHONE_REQUIRED for customer_phone_required", async () => {
      routes = [
        ["POST", "/transactions/v1/cards", jsonResponse(coreError("customer_phone_required"), 409)],
      ];
      stubFetch();

      expect(await add()).toEqual({ saved: false, code: "PHONE_REQUIRED" });
    });

    it("rejects card_limit_reached with the core's message and details", async () => {
      routes = [
        [
          "POST",
          "/transactions/v1/cards",
          jsonResponse(
            coreError("card_limit_reached", "Ten cards at most.", "conflict", { limit: 10 }),
            409,
          ),
        ],
      ];
      stubFetch();

      const error = await catchError(add());

      expect(error.message).toBe("Ten cards at most.");
      expect(error.code).toBe("409");
      expect(error.body.error.details).toEqual({ limit: 10 });
    });
  });

  it("rejects removing a card the core does not know", async () => {
    routes = [
      ["DELETE", "/transactions/v1/cards/sky-9", jsonResponse(coreError("not_found"), 404)],
    ];
    stubFetch();

    const error = await catchError(
      removeCustomerCard({}, CORE_HOST, CUSTOMER_TOKEN, SECURE, "sky-9", 12, true),
    );

    expect(error.code).toBe("404");
  });

  it("maps the payment methods to results, count and pk", async () => {
    const checkout = await start({ flag: true });
    routes.unshift([
      "GET",
      "/transactions/v1/payment_methods",
      jsonResponse({
        data: [
          corePaymentMethod(),
          corePaymentMethod({ id: "u2", payment_method: "Cards", category: "Cards" }),
        ],
      }),
    ]);

    const methods = await checkout.getCustomerPaymentMethods();

    expect(methods.map(method => method.id)).toEqual(["0190bbbb-0000-7000-8000-000000000001"]);
    expect(methods[0]).toMatchObject({
      payment_method: "SPEI",
      priority: 2,
      category: "Bank transfer",
    });
  });

  it("maps the payment methods answer to the monolith's page shape", async () => {
    routes = [
      ["GET", "/transactions/v1/payment_methods", jsonResponse({ data: [corePaymentMethod()] })],
    ];
    stubFetch();

    const page = await fetchCustomerAPMs(CORE_HOST, API_KEY);

    expect(page).toEqual({
      count: 1,
      next: null,
      previous: null,
      results: [{ ...corePaymentMethod(), pk: corePaymentMethod().id }],
    });
  });

  describe("SafetyPay banks", () => {
    const banks = [
      coreBank(),
      coreBank({ bank_id: 7, code: "OXXO", name: "OXXO", payment_type: "cash", logo_url: null }),
      coreBank({ code: "SANT", name: "Santander" }),
    ];

    it("groups the banks by payment type with the monolith's bank item", async () => {
      routes = [["GET", "/transactions/v1/safetypay/banks", jsonResponse({ data: banks })]];
      stubFetch();

      const grouped = await fetchSafetyPayBanks(CORE_HOST, API_KEY);

      expect(Object.keys(grouped).sort()).toEqual(["cash", "transfer"]);
      expect(grouped.transfer).toHaveLength(2);
      expect(grouped.cash[0].bank).toMatchObject({
        id: 7,
        bank_code: "OXXO",
        name: "OXXO",
        logo: null,
        country_name: "México",
        payment_type: "cash",
      });
    });

    it("returns the banks of one payment type as a list of bank items", async () => {
      routes = [
        ["GET", "/transactions/v1/safetypay/banks/transfer", jsonResponse({ data: [coreBank()] })],
      ];
      stubFetch();

      const list = await fetchSafetyPayBanksByType(CORE_HOST, API_KEY, "transfer");

      expect(list).toHaveLength(1);
      expect(list[0].bank).toMatchObject({
        id: 41,
        bank_code: "BBVA",
        name: "BBVA",
        logo: "https://cdn.example/bbva.png",
      });
    });

    it("rejects an invalid payment type with the core's message", async () => {
      routes = [
        [
          "GET",
          "/transactions/v1/safetypay/banks/other",
          jsonResponse(coreError("invalid_request", "Unknown payment type."), 400),
        ],
      ];
      stubFetch();

      const error = await catchError(fetchSafetyPayBanksByType(CORE_HOST, API_KEY, "other"));

      expect(error.message).toBe("Unknown payment type.");
    });
  });
});
