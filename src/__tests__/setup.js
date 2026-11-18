// The SDK expects the Skyflow script to be loaded globally before its modules run.
globalThis.Skyflow = {
  ValidationRuleType: { LENGTH_MATCH_RULE: "LENGTH_MATCH_RULE" },
  ContainerType: { COLLECT: "COLLECT" },
  ElementType: {},
  EventName: {},
  Env: { DEV: "DEV", PROD: "PROD" },
  LogLevel: { ERROR: "ERROR" },
};
