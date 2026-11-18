import { describe, expect, it } from "vitest";
import { resolveCoreUrl } from "../data/coreApi";
import { checkoutRouterError } from "../data/checkoutApi";

describe("resolveCoreUrl", () => {
  const HTTPS_CORE = "https://api-stage.tonder.io";

  it("resolves a path against the core host", () => {
    expect(resolveCoreUrl(HTTPS_CORE, "/transactions/v1/abc")).toBe(
      "https://api-stage.tonder.io/transactions/v1/abc",
    );
  });

  it("accepts an absolute URL of the core host", () => {
    expect(resolveCoreUrl(HTTPS_CORE, `${HTTPS_CORE}/transactions/v1/abc`)).toBe(
      `${HTTPS_CORE}/transactions/v1/abc`,
    );
  });

  it.each([
    "https://attacker.example/transactions/v1/abc",
    "http://api-stage.tonder.io/transactions/v1/abc",
    "http://attacker.example/x",
    "//attacker.example/x",
    "javascript:alert(1)",
  ])("refuses %s", url => {
    expect(resolveCoreUrl(HTTPS_CORE, url)).toBeNull();
  });

  it("allows http only for a localhost core", () => {
    expect(
      resolveCoreUrl("http://localhost:3000", "http://localhost:3000/transactions/v1/abc"),
    ).toBe("http://localhost:3000/transactions/v1/abc");
    expect(
      resolveCoreUrl("http://core.example", "http://core.example/transactions/v1/abc"),
    ).toBeNull();
  });
});

describe("checkoutRouterError", () => {
  it("builds the error both engines reject with", () => {
    const error = checkoutRouterError({ status: "404" });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Failed to start checkout router");
    expect(error.details).toEqual({ status: "404" });
  });
});
