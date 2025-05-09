import get from "lodash.get";

export function fetchWithSignatureHeaders(
  url,
  options = {},
  signatures,
  signatureField = "transaction",
) {
  const defaultHeaders = {
    "X-Signature-Transaction": get(signatures, signatureField, ""),
    "X-Client-Source": "web-sdk",
  };

  options.headers = {
    ...defaultHeaders,
    ...(options.headers || {}),
  };

  return fetch(url, options);
}

export const getBaseUrlByEnv = (mode = "stage") => {
  const prefixByEnv = {
    production: "",
    stage: "-stage",
    development: "-dev",
    "": "-dev",
  };
  return `https://api${prefixByEnv[mode]}.tonder.io`;
};
