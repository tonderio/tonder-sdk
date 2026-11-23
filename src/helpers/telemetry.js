import { createTelemetry } from "@tonder.io/client-telemetry";

// Telemetry only shows which public methods merchants still call. It must never throw into the
// merchant's page, and callers never await it.
export function createSdkTelemetry({ mode, endpoint, authorization }) {
  try {
    return createTelemetry({
      sdk: { name: "web-sdk-legacy", version: process.env.SDK_VERSION },
      env: mode,
      endpoint,
      getAuthorization: authorization,
    });
  } catch {
    return null;
  }
}

export function reportMethodCalled(telemetry, method) {
  try {
    telemetry?.methodCalled(method);
  } catch {
    // Reporting is best effort.
  }
}
