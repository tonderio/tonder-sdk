const TONDER_URL_BY_MODE = Object.freeze({
  production: "https://app.tonder.io",
  sandbox: "https://sandbox.tonder.io",
  stage: "https://stage.tonder.io",
  development: "http://localhost:8000",
});

// Host of the payments core, which serves the business configuration and card payments.
const TONDER_CORE_URL_BY_MODE = Object.freeze({
  production: "https://api.tonder.io",
  sandbox: "https://api-stage.tonder.io",
  stage: "https://api-stage.tonder.io",
  development: "https://api-dev.tonder.io",
});

export { TONDER_URL_BY_MODE, TONDER_CORE_URL_BY_MODE };
