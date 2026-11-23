import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InlineCheckout } from "../classes/inlineCheckout";
import { LiteInlineCheckout } from "../classes/LiteInlineCheckout";
import { HTML_IDS } from "../shared/constants/htmlTonderIds";
import { API_KEY, CORE_HOST } from "./fixtures";
import pkg from "../../package.json";

const client = vi.hoisted(() => ({
  methodCalled: vi.fn(),
  flowStep: vi.fn(),
  flowFailed: vi.fn(),
  threedsChallengeShown: vi.fn(),
  threedsMessage: vi.fn(),
  threedsTimeout: vi.fn(),
  threedsFallbackRead: vi.fn(),
}));
const createTelemetry = vi.hoisted(() => vi.fn());

vi.mock("@tonder.io/client-telemetry", () => ({ createTelemetry }));

const options = { apiKey: API_KEY, mode: "stage", returnUrl: "r" };

const reported = () => client.methodCalled.mock.calls;

beforeEach(() => {
  createTelemetry.mockReset().mockReturnValue(client);
  Object.values(client).forEach(fn => fn.mockReset());
  document.body.innerHTML = `<div id="${HTML_IDS.tonderCheckout}"></div>`;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }),
  );
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("client telemetry", () => {
  it("is created with the legacy SDK identity, the Tonder API and the SDK credential", () => {
    new LiteInlineCheckout({ ...options, mode: "production" });

    expect(createTelemetry).toHaveBeenCalledTimes(1);
    const config = createTelemetry.mock.calls[0][0];
    expect(config.sdk).toEqual({ name: "web-sdk-legacy", version: pkg.version });
    expect(config.env).toBe("production");
    expect(config.endpoint).toBe("https://api.tonder.io/telemetry");
    expect(config.getAuthorization()).toBe(`Token ${API_KEY}`);
    expect(Object.keys(config).sort()).toEqual(["endpoint", "env", "getAuthorization", "sdk"]);
  });

  it("uses the payments API host of the mode as the endpoint", () => {
    new InlineCheckout(options);

    expect(createTelemetry.mock.calls[0][0].endpoint).toBe(`${CORE_HOST}/telemetry`);
  });

  it.each([
    ["LiteInlineCheckout", () => new LiteInlineCheckout(options)],
    ["InlineCheckout", () => new InlineCheckout(options)],
  ])("%s reports each public method with only its name", async (_name, create) => {
    const checkout = create();
    const calls = [
      ["configureCheckout", () => checkout.configureCheckout({})],
      ["payment", () => checkout.payment({ customer: {}, cart: { total: "1" } })],
      ["verify3dsTransaction", () => checkout.verify3dsTransaction()],
      ["injectCheckout", () => checkout.injectCheckout()],
    ];
    if (checkout instanceof LiteInlineCheckout) {
      calls.push(
        ["getCustomerCards", () => checkout.getCustomerCards()],
        ["saveCustomerCard", () => checkout.saveCustomerCard()],
        ["removeCustomerCard", () => checkout.removeCustomerCard("sky-1")],
        ["getCustomerPaymentMethods", () => checkout.getCustomerPaymentMethods()],
        ["mountCardFields", () => checkout.mountCardFields({ fields: [] })],
        ["unmountCardFields", () => checkout.unmountCardFields()],
        ["revealCardFields", () => checkout.revealCardFields({ fields: [] })],
      );
    } else {
      calls.push(["removeCheckout", () => checkout.removeCheckout()]);
    }

    for (const [, call] of calls) {
      await Promise.resolve()
        .then(call)
        .catch(() => {});
    }

    expect(reported().map(args => args[0])).toEqual(expect.arrayContaining(calls.map(c => c[0])));
    reported().forEach(args => expect(args).toHaveLength(1));
  });

  it("reports nothing but method calls", async () => {
    const checkout = new LiteInlineCheckout(options);
    checkout.configureCheckout({ customer: { email: "ana@example.com" } });
    await checkout.payment({ customer: {}, cart: { total: "1" } }).catch(() => {});

    const { methodCalled, ...others } = client;
    Object.values(others).forEach(fn => expect(fn).not.toHaveBeenCalled());
    expect(JSON.stringify(reported())).not.toContain("ana@example.com");
  });

  it("never breaks the payment path when reporting throws", async () => {
    client.methodCalled.mockImplementation(() => {
      throw new Error("telemetry down");
    });
    const checkout = new LiteInlineCheckout(options);
    vi.spyOn(checkout, "_checkout").mockResolvedValue({ status: "200", message: "Success" });

    expect(() => checkout.configureCheckout({})).not.toThrow();
    await expect(checkout.payment({ customer: {}, cart: { total: "1" } })).resolves.toEqual({
      status: "200",
      message: "Success",
    });
  });

  it("never waits for the report on the payment path", async () => {
    client.methodCalled.mockReturnValue(new Promise(() => {}));
    const checkout = new LiteInlineCheckout(options);
    vi.spyOn(checkout, "_checkout").mockResolvedValue({ status: "200", message: "Success" });

    await expect(checkout.payment({ customer: {}, cart: { total: "1" } })).resolves.toEqual({
      status: "200",
      message: "Success",
    });
  });

  it("never breaks the SDK when the client cannot be created", async () => {
    createTelemetry.mockImplementation(() => {
      throw new Error("bad options");
    });
    const checkout = new LiteInlineCheckout(options);
    vi.spyOn(checkout, "_checkout").mockResolvedValue({ status: "200", message: "Success" });

    expect(() => checkout.configureCheckout({})).not.toThrow();
    await expect(checkout.payment({ customer: {}, cart: { total: "1" } })).resolves.toBeDefined();
  });
});
