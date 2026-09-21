const STATIC_ASSETS_URL_BY_MODE = Object.freeze({
  production: "https://d35a75syrgujp0.cloudfront.net",
  sandbox: "https://static.staging.tonder.io",
  stage: "https://static.staging.tonder.io",
  development: "https://static.staging.tonder.io",
});

const getStaticAssetsUrlByMode = mode =>
  STATIC_ASSETS_URL_BY_MODE[mode] || STATIC_ASSETS_URL_BY_MODE["stage"];

export { STATIC_ASSETS_URL_BY_MODE, getStaticAssetsUrlByMode };
