import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InlineCheckout } from "../classes/inlineCheckout";
import { globalLoader } from "../classes/globalLoader";
import { HTML_IDS } from "../shared/constants/htmlTonderIds";
import { LiteInlineCheckout } from "../classes/LiteInlineCheckout";
import {
  API_KEY,
  CORE_HOST,
  businessConfig,
  coreDeclined,
  coreRedirect,
  coreSuccess,
  jsonResponse,
} from "./fixtures";

const MONOLITH = "https://stage.tonder.io";
const CUSTOMER = { id: 5, auth_token: "customer-token" };
const PAYMENT = {
  customer: { firstName: "Ana", lastName: "Lopez", email: "ana@example.com" },
  cart: { total: "100", items: [{ name: "Shirt", quantity: 1 }] },
  metadata: { order_id: 9 },
  currency: "MXN",
  order_reference: "order-1",
};

let routes;
let calls;

const stubFetch = () => {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, options = {}) => {
      calls.push({ url, options, body: options.body ? JSON.parse(options.body) : undefined });
      const route = routes.find(([match]) => url.includes(match));
      if (!route) throw new Error(`unexpected request: ${url}`);
      const [, response] = route;
      return typeof response === "function" ? response(url, options) : response;
    }),
  );
};

const legacyRoutes = () => [
  ["/api/v1/orders/", jsonResponse({ id: 31 }, 201)],
  ["/payments/", jsonResponse({ pk: 77 }, 201)],
  ["/api/v1/checkout-router/", jsonResponse({ status: "200", message: "Success" }, 201)],
];

const calledUrls = () => calls.map(call => call.url);

const newV2 = () => {
  const checkout = new LiteInlineCheckout({ apiKey: API_KEY, mode: "stage", returnUrl: "r" });
  vi.spyOn(checkout, "_getCustomer").mockResolvedValue(CUSTOMER);
  return checkout;
};

const newV1 = () => {
  const checkout = new InlineCheckout({ apiKey: API_KEY, mode: "stage", returnUrl: "r" });
  vi.spyOn(checkout, "_checkout").mockImplementation(() =>
    checkout._handleCheckout({
      card: { skyflow_id: "sky-1" },
      savedCardId: "sky-1",
      customer: CUSTOMER,
    }),
  );
  return checkout;
};

const entryPoints = [
  ["v2 LiteInlineCheckout", newV2, { ...PAYMENT, card: "sky-1" }],
  ["v1 InlineCheckout", newV1, PAYMENT],
];

beforeEach(() => {
  document.body.innerHTML = `<div id="${HTML_IDS.tonderCheckout}"></div>`;
  InlineCheckout.injected = false;
  globalLoader.requestCount = 0;
  const store = new Map();
  vi.stubGlobal("localStorage", {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
  });
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe.each(entryPoints)("%s", (_name, create, data) => {
  describe("start-up failure", () => {
    it.each([
      ["a 403", () => jsonResponse({ error: { code: "origin_not_allowed" } }, 403)],
      ["a 500", () => jsonResponse({ error: { code: "internal_error" } }, 500)],
      [
        "a network error",
        () => {
          throw new TypeError("Failed to fetch");
        },
      ],
      ["a null JSON body", () => jsonResponse(null)],
      ["a JSON body that is not an object", () => jsonResponse(["unexpected"])],
      [
        "a body that is not JSON",
        () => ({
          ok: true,
          status: 200,
          json: async () => {
            throw new SyntaxError("Unexpected token <");
          },
        }),
      ],
    ])("rejects with a clear error and hides the loader after %s", async (_label, response) => {
      routes = [["/transactions/v1/business/config", response]];
      stubFetch();
      const checkout = create();
      vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(checkout.injectCheckout()).rejects.toThrow(
        "The Tonder checkout configuration could not be loaded",
      );
      expect(globalLoader.requestCount).toBe(0);
      expect(calledUrls().filter(url => url.startsWith(MONOLITH))).toEqual([]);
    });
  });

  describe("aborted start-up", () => {
    it("keeps the abort error as it is", async () => {
      routes = [
        [
          "/transactions/v1/business/config",
          () => {
            throw new DOMException("The operation was aborted.", "AbortError");
          },
        ],
      ];
      stubFetch();
      const checkout = create();

      await expect(checkout._initializeCheckout()).rejects.toMatchObject({ name: "AbortError" });
    });
  });

  describe("verify errors", () => {
    it.each([
      [503, { error: { code: "unavailable", message: "Try later" } }, "Try later"],
      [429, undefined, "Error"],
    ])("resolve with the checkout-router error shape after a %s", async (code, body, message) => {
      localStorage.setItem(
        "verify_transaction_status",
        JSON.stringify({
          url: "/transactions/v1/0190aaaa",
          engine: "core",
          expires: Date.now() + 60000,
        }),
      );
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        ["/transactions/v1/0190aaaa", jsonResponse(body, code)],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      vi.spyOn(console, "error").mockImplementation(() => {});

      expect(await checkout.verify3dsTransaction()).toEqual({
        status: String(code),
        message,
        psp_response: [],
        is_route_finished: false,
      });
      expect(localStorage.getItem("verify_transaction_status")).not.toBeNull();
    });
  });

  describe("requests that carry the API key", () => {
    it("never follow redirects", async () => {
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        ["/transactions/v1/process", jsonResponse(coreRedirect(), 201)],
        ["/transactions/v1/0190aaaa", jsonResponse(coreSuccess())],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      vi.spyOn(checkout.process3ds, "redirectToChallenge").mockImplementation(function () {
        this.saveVerifyTransactionUrl();
      });
      checkout.payment(data);
      await vi.waitFor(() =>
        expect(localStorage.getItem("verify_transaction_status")).toBeTruthy(),
      );
      await checkout.verify3dsTransaction();

      const coreCalls = calls.filter(call => call.url.startsWith(CORE_HOST));
      expect(coreCalls).toHaveLength(3);
      coreCalls.forEach(call => expect(call.options.redirect).toBe("error"));
    });
  });

  describe("core errors", () => {
    it("rejects with the checkout-router error shape, not the raw core body", async () => {
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        [
          "/transactions/v1/process",
          jsonResponse({ error: { code: "invalid_request", message: "Bad amount" } }, 400),
        ],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();

      const error = await checkout.payment(data).catch(e => e);
      expect(error.message).toBe("Failed to start checkout router");
      expect(error.details).toEqual({
        status: "400",
        message: "Bad amount",
        psp_response: [],
        is_route_finished: false,
      });
    });
  });

  describe("flag ON", () => {
    it("reads the business configuration from the core at start-up", async () => {
      routes = [["/transactions/v1/business/config", jsonResponse(businessConfig())]];
      stubFetch();
      await create()._initializeCheckout();

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe(`${CORE_HOST}/transactions/v1/business/config`);
      expect(calls[0].options.headers.Authorization).toBe(`Token ${API_KEY}`);
      expect(calls[0].options.headers["X-App-Origin"]).toBe("sdk/web-legacy");
    });

    it("pays through the core and resolves today's checkout-router body", async () => {
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        ["/transactions/v1/process", jsonResponse(coreSuccess(), 201)],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      const result = await checkout.payment(data);

      const process = calls.find(call => call.url.endsWith("/transactions/v1/process"));
      expect(process.options.method).toBe("POST");
      expect(process.options.headers.Authorization).toBe(`Token ${API_KEY}`);
      expect(process.options.headers["X-App-Origin"]).toBe("sdk/web-legacy");
      expect(process.options.headers["X-Request-Id"]).toBeTruthy();
      expect(Object.keys(process.body.browser_info).sort()).toEqual([
        "color_depth",
        "javascript_enabled",
        "language",
        "screen_height",
        "screen_width",
        "time_zone",
        "user_agent",
      ]);
      expect(process.body).toMatchObject({
        operation_type: "payment",
        amount: 100,
        client_reference: "order-1",
        payment_method: { type: "CARD", token: "sky-1" },
        metadata: { order_id: 9 },
        items: [{ name: "Shirt", quantity: 1 }],
      });
      expect(calledUrls().some(url => /orders|checkout-router|\/payments\//.test(url))).toBe(false);
      expect(result).toMatchObject({
        status: "200",
        message: "Success",
        checkout_id: "route-1",
        transaction_status: "Success",
        transaction_id: 555,
        payment_id: 77,
        provider: "tonder",
      });
      expect(result.actions.map(action => action.name)).toEqual([
        "verify_transaction_status",
        "refund_transaction",
      ]);
    });

    it("rejects a decline with the rebuilt body in error.details", async () => {
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        ["/transactions/v1/process", jsonResponse(coreDeclined(), 200)],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();

      const error = await checkout.payment(data).catch(e => e);
      expect(error.details).toMatchObject({
        status: "404",
        message: "Do not honor",
        psp_response: [{ code: "05" }, { code: "51" }],
        decline_code: "GS01",
      });
    });

    it("keeps APMs on the legacy flow", async () => {
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        ...legacyRoutes(),
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      vi.spyOn(checkout, "_checkout").mockImplementation(() =>
        checkout._handleCheckout({ payment_method: "mercadopago", customer: CUSTOMER }),
      );
      await checkout.payment(data);

      expect(calledUrls().some(url => url.includes("/transactions/v1/process"))).toBe(false);
      expect(calledUrls()).toContain(`${MONOLITH}/api/v1/checkout-router/`);
    });

    it("retries once on the legacy flow when the core answers operations_disabled", async () => {
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        [
          "/transactions/v1/process",
          jsonResponse({ error: { code: "operations_disabled" }, status_code: 503 }, 503),
        ],
        ...legacyRoutes(),
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      const result = await checkout.payment(data);

      expect(calledUrls()).toContain(`${MONOLITH}/api/v1/checkout-router/`);
      expect(result.message).toBe("Success");
    });

    it.each([
      ["a 500", jsonResponse({ error: { code: "internal_error" } }, 500)],
      ["a 502", jsonResponse({ error: { code: "service_unavailable" } }, 502)],
      ["a 504", jsonResponse({ error: { code: "operations_disabled" } }, 504)],
      [
        "a 500 with the operations_disabled code",
        jsonResponse({ error: { code: "operations_disabled" } }, 500),
      ],
      ["a 503 with another code", jsonResponse({ error: { code: "maintenance" } }, 503)],
    ])("never retries on the legacy flow after %s", async (_label, response) => {
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        ["/transactions/v1/process", response],
        ...legacyRoutes(),
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();

      const error = await checkout.payment(data).catch(e => e);
      expect(error).toBeInstanceOf(Error);
      expect(calledUrls().filter(url => url.startsWith(MONOLITH))).toEqual([]);
    });

    it("never retries on the legacy flow after a network error", async () => {
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        [
          "/transactions/v1/process",
          () => {
            throw new TypeError("Failed to fetch");
          },
        ],
        ...legacyRoutes(),
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();

      await expect(checkout.payment(data)).rejects.toThrow("Failed to fetch");
      expect(calledUrls().filter(url => url.startsWith(MONOLITH))).toEqual([]);
    });

    it("keeps an APM on the legacy flow whatever the case of its name", async () => {
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        ...legacyRoutes(),
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      vi.spyOn(checkout, "_checkout").mockImplementation(() =>
        checkout._handleCheckout({ payment_method: "MercadoPago", customer: CUSTOMER }),
      );
      await checkout.payment(data);

      expect(calledUrls().some(url => url.includes("/transactions/v1/process"))).toBe(false);
    });

    it("stores the engine with the 3DS state and verifies through the core", async () => {
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        ["/transactions/v1/process", jsonResponse(coreRedirect(), 201)],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      vi.spyOn(checkout.process3ds, "redirectToChallenge").mockImplementation(function () {
        this.saveVerifyTransactionUrl();
      });
      // Like today, payment() never settles on a redirect: the page navigates away.
      checkout.payment(data);
      await vi.waitFor(() =>
        expect(localStorage.getItem("verify_transaction_status")).toBeTruthy(),
      );
      expect(JSON.parse(localStorage.getItem("verify_transaction_status"))).toMatchObject({
        url: "/transactions/v1/0190aaaa",
        engine: "core",
      });

      // The page reloads after the challenge; the flag may have changed meanwhile.
      routes = [
        [
          "/transactions/v1/business/config",
          jsonResponse(businessConfig({ core_payments_enabled: false })),
        ],
        ["/transactions/v1/0190aaaa", jsonResponse(coreSuccess({ rail_transaction: { id: 1 } }))],
      ];
      stubFetch();
      const reloaded = create();
      await reloaded._initializeCheckout();
      const result = await reloaded.verify3dsTransaction();

      expect(result).toMatchObject({
        id: 555,
        status: "Success",
        transaction_status: "Success",
        provider: "tonder",
        checkout_id: "route-1",
        payment: { id: 77 },
      });
      expect(result).not.toHaveProperty("actions");
      expect(calls.map(call => call.url)).toEqual([
        `${CORE_HOST}/transactions/v1/business/config`,
        `${CORE_HOST}/transactions/v1/0190aaaa`,
      ]);
      expect(calls[1].options.headers.Authorization).toBe(`Token ${API_KEY}`);
      expect(localStorage.getItem("verify_transaction_status")).toBeNull();
    });

    const storeCoreState = () =>
      localStorage.setItem(
        "verify_transaction_status",
        JSON.stringify({
          url: "/transactions/v1/0190aaaa",
          engine: "core",
          expires: Date.now() + 60000,
        }),
      );

    it("resolves a declined core payment with the legacy transaction object and never resumes the route", async () => {
      storeCoreState();
      const declined = coreDeclined();
      declined.routing.is_route_finished = false;
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        ["/transactions/v1/0190aaaa", jsonResponse(declined)],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      const result = await checkout.verify3dsTransaction();

      expect(result).toMatchObject({ status: "Declined", transaction_status: "Declined" });
      expect(result).not.toHaveProperty("message");
      expect(calledUrls().filter(url => url.startsWith(MONOLITH))).toEqual([]);
      expect(calledUrls().some(url => url.includes("checkout-router"))).toBe(false);
      expect(localStorage.getItem("verify_transaction_status")).toBeNull();
    });

    it.each([
      ["a 502", () => jsonResponse({ error: { code: "bad_gateway" } }, 502)],
      ["a 503", () => jsonResponse({ error: { code: "unavailable" } }, 503)],
      ["a 500", () => jsonResponse({ error: { code: "internal_error" } }, 500)],
      ["a 429", () => jsonResponse({ error: { code: "rate_limited" } }, 429)],
      ["a 403", () => jsonResponse({ error: { code: "origin_not_allowed" } }, 403)],
      ["a 408", () => jsonResponse({ error: { code: "timeout" } }, 408)],
      ["a 425", () => jsonResponse({ error: { code: "too_early" } }, 425)],
      [
        "a network error",
        () => {
          throw new TypeError("Failed to fetch");
        },
      ],
    ])("keeps the 3DS state after %s from the core", async (_label, response) => {
      storeCoreState();
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        ["/transactions/v1/0190aaaa", response],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      await checkout.verify3dsTransaction();

      expect(JSON.parse(localStorage.getItem("verify_transaction_status")).engine).toBe("core");
    });

    it.each([
      ["a 404", 404],
      ["a 401", 401],
    ])("clears the 3DS state after %s from the core", async (_label, code) => {
      storeCoreState();
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        ["/transactions/v1/0190aaaa", jsonResponse({ error: { code: "not_found" } }, code)],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      await checkout.verify3dsTransaction();

      expect(localStorage.getItem("verify_transaction_status")).toBeNull();
    });

    it("keeps the 3DS state while the core payment is Processing", async () => {
      storeCoreState();
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        [
          "/transactions/v1/0190aaaa",
          jsonResponse(coreSuccess({ status: "Processing", transaction_status: "Processing" })),
        ],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      await checkout.verify3dsTransaction();

      expect(localStorage.getItem("verify_transaction_status")).not.toBeNull();
    });

    it.each(["Success", "Authorized", "Declined", "Failed", "Cancelled", "Expired"])(
      "clears the 3DS state once the core payment is %s",
      async finalStatus => {
        storeCoreState();
        routes = [
          ["/transactions/v1/business/config", jsonResponse(businessConfig())],
          [
            "/transactions/v1/0190aaaa",
            jsonResponse(coreSuccess({ status: finalStatus, transaction_status: finalStatus })),
          ],
        ];
        stubFetch();
        const checkout = create();
        await checkout._initializeCheckout();
        await checkout.verify3dsTransaction();

        expect(localStorage.getItem("verify_transaction_status")).toBeNull();
      },
    );

    it("never sends the API key to a stored URL of another host", async () => {
      localStorage.setItem(
        "verify_transaction_status",
        JSON.stringify({
          url: "http://attacker.example/transactions/v1/0190aaaa",
          engine: "core",
          expires: Date.now() + 60000,
        }),
      );
      routes = [["/transactions/v1/business/config", jsonResponse(businessConfig())]];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      await checkout.verify3dsTransaction();

      expect(calledUrls()).toEqual([`${CORE_HOST}/transactions/v1/business/config`]);
      expect(localStorage.getItem("verify_transaction_status")).toBeNull();
    });

    it("exposes the verified payment as the 3DS payload", async () => {
      storeCoreState();
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        ["/transactions/v1/0190aaaa", jsonResponse(coreSuccess())],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      const result = await checkout.verify3dsTransaction();

      expect(checkout.process3ds.payload).toBe(result);
    });

    it("clears the 3DS state once the core payment is Authorized", async () => {
      storeCoreState();
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        [
          "/transactions/v1/0190aaaa",
          jsonResponse(coreSuccess({ status: "Authorized", transaction_status: "Authorized" })),
        ],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      await checkout.verify3dsTransaction();

      expect(localStorage.getItem("verify_transaction_status")).toBeNull();
    });

    it("keeps the 3DS state while the core payment is not final", async () => {
      storeCoreState();
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        [
          "/transactions/v1/0190aaaa",
          jsonResponse(coreSuccess({ status: "Pending", transaction_status: "Pending" })),
        ],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      const result = await checkout.verify3dsTransaction();

      expect(result.transaction_status).toBe("Pending");
      expect(JSON.parse(localStorage.getItem("verify_transaction_status")).engine).toBe("core");
    });
  });

  describe("engine pinned across a reload", () => {
    it("never redirects again when a core payment is still pending with a redirect", async () => {
      localStorage.setItem(
        "verify_transaction_status",
        JSON.stringify({
          url: "/transactions/v1/0190aaaa",
          engine: "core",
          expires: Date.now() + 60000,
        }),
      );
      routes = [
        [
          "/transactions/v1/business/config",
          jsonResponse(businessConfig({ core_payments_enabled: false })),
        ],
        ["/transactions/v1/0190aaaa", jsonResponse(coreRedirect())],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      const redirect = vi.spyOn(checkout.process3ds, "redirectToChallenge");
      const result = await checkout.verify3dsTransaction();

      expect(redirect).not.toHaveBeenCalled();
      expect(result.transaction_status).toBe("Pending");
      expect(JSON.parse(localStorage.getItem("verify_transaction_status")).engine).toBe("core");
    });

    it("resolves the legacy transaction object as is on the legacy engine", async () => {
      localStorage.setItem(
        "verify_transaction_status",
        JSON.stringify({
          url: "/api/v1/tonder/ksk/business/12/payments/77/transactions/555",
          engine: "legacy",
          expires: Date.now() + 60000,
        }),
      );
      const monolith = {
        id: 555,
        status: "Success",
        transaction_status: "Success",
        fee_amount: "3.0000",
        checkout: { id: "route-1", is_route_finished: true },
      };
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        ["/api/v1/tonder/ksk/", jsonResponse(monolith)],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();

      expect(await checkout.verify3dsTransaction()).toEqual(monolith);
      expect(calledUrls().some(url => url.includes("/transactions/v1/0190aaaa"))).toBe(false);
    });

    it("keeps the legacy engine when the flag turned ON meanwhile", async () => {
      localStorage.setItem(
        "verify_transaction_status",
        JSON.stringify({
          url: "/api/v1/tonder/ksk/business/12/payments/77/transactions/555",
          engine: "legacy",
          expires: Date.now() + 60000,
        }),
      );
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        [
          "/api/v1/tonder/ksk/",
          jsonResponse({
            status: "Pending",
            redirect_post_url: "https://acs.example/challenge",
            creq: "c",
          }),
        ],
        ["/api/v1/checkout-router/", jsonResponse({}, 200)],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      vi.spyOn(checkout.process3ds, "handle3dsChallenge").mockResolvedValue();
      await checkout.verify3dsTransaction().catch(() => {});

      expect(calledUrls().some(url => url.includes("/transactions/v1/0190aaaa"))).toBe(false);
    });
  });

  describe("flag OFF", () => {
    const off = () => [
      [
        "/transactions/v1/business/config",
        jsonResponse(businessConfig({ core_payments_enabled: false })),
      ],
      ...legacyRoutes(),
    ];

    it("keeps today's orders, payments and checkout-router flow", async () => {
      routes = off();
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      const result = await checkout.payment(data);

      expect(calledUrls()).toEqual([
        `${CORE_HOST}/transactions/v1/business/config`,
        `${MONOLITH}/api/v1/orders/`,
        `${MONOLITH}/api/v1/business/12/payments/`,
        `${MONOLITH}/api/v1/checkout-router/`,
      ]);
      expect(calls[3].body).toMatchObject({ order_id: 31, payment_id: 77, business_id: 12 });
      expect(result).toEqual({ status: "200", message: "Success" });
    });

    it("treats a configuration without the flag as OFF", async () => {
      const { core_payments_enabled, ...withoutFlag } = businessConfig();
      routes = [["/transactions/v1/business/config", jsonResponse(withoutFlag)], ...legacyRoutes()];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      await checkout.payment(data);

      expect(calledUrls().some(url => url.includes("/transactions/v1/process"))).toBe(false);
    });

    it("still resumes a declined legacy payment through checkout-router", async () => {
      localStorage.setItem(
        "verify_transaction_status",
        JSON.stringify({
          url: "/api/v1/tonder/ksk/business/12/payments/77/transactions/555",
          engine: "legacy",
          expires: Date.now() + 60000,
        }),
      );
      routes = [
        ["/transactions/v1/business/config", jsonResponse(businessConfig())],
        [
          "/api/v1/tonder/ksk/",
          jsonResponse({ status: "Declined", transaction_status: "Declined", checkout_id: "c1" }),
        ],
        ["/api/v1/checkout-router/", jsonResponse({ status: "200", message: "Success" }, 201)],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      const result = await checkout.verify3dsTransaction();

      const resume = calls.find(call => call.url.endsWith("/api/v1/checkout-router/"));
      expect(resume.body).toEqual({ checkout_id: "c1" });
      expect(result).toEqual({ status: "200", message: "Success" });
    });

    it("verifies a legacy 3DS state on the monolith", async () => {
      localStorage.setItem(
        "verify_transaction_status",
        JSON.stringify({
          url: "/api/v1/tonder/ksk/business/12/payments/77/transactions/555",
          expires: Date.now() + 60000,
        }),
      );
      routes = [
        [
          "/transactions/v1/business/config",
          jsonResponse(businessConfig({ core_payments_enabled: true })),
        ],
        ["/api/v1/tonder/ksk/", jsonResponse({ status: "Success", id: 555 })],
      ];
      stubFetch();
      const checkout = create();
      await checkout._initializeCheckout();
      const result = await checkout.verify3dsTransaction();

      expect(calledUrls()).toContain(
        `${MONOLITH}/api/v1/tonder/ksk/business/12/payments/77/transactions/555`,
      );
      expect(result).toEqual({ status: "Success", id: 555 });
    });
  });
});

describe("InlineCheckout start-up failure", () => {
  it("shows the payer a message in the container", async () => {
    routes = [
      [
        "/transactions/v1/business/config",
        jsonResponse({ error: { code: "origin_not_allowed" } }, 403),
      ],
    ];
    stubFetch();
    const checkout = new InlineCheckout({ apiKey: API_KEY, mode: "stage", returnUrl: "r" });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(checkout.injectCheckout()).rejects.toThrow("could not be loaded");
    const message = document.querySelector("#tonder-config-error");
    expect(message).not.toBeNull();
    expect(message.textContent).toContain("No se pudieron cargar los datos del comercio.");
  });

  it("shows no message when the request was aborted", async () => {
    routes = [
      [
        "/transactions/v1/business/config",
        () => {
          throw new DOMException("The operation was aborted.", "AbortError");
        },
      ],
    ];
    stubFetch();
    const checkout = new InlineCheckout({ apiKey: API_KEY, mode: "stage", returnUrl: "r" });

    await expect(checkout.injectCheckout()).rejects.toMatchObject({ name: "AbortError" });
    expect(document.querySelector("#tonder-config-error")).toBeNull();
  });
});
