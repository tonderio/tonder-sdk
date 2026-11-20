import { coreHeaders, coreRoute } from "./coreApi";

export async function getVaultToken(coreUrl, apiKey, signal = null) {
  const response = await fetch(coreRoute(coreUrl, "/vault-token"), {
    method: "GET",
    headers: coreHeaders(apiKey),
    signal: signal,
  });

  if (response.ok) {
    const responseBody = await response.json();
    return responseBody.token;
  } else {
    throw new Error("Failed to retrieve bearer token");
  }
}
