// Fails when a built bundle contains a string-evaluation sink. Pages that load this SDK should be
// able to run an enforcing CSP without 'unsafe-eval'; a sink that runs on page load breaks that.
const fs = require("fs");
const path = require("path");

const bundlePath = path.resolve(process.argv[2] || "v1/bundle.min.js");
const source = fs.readFileSync(bundlePath, "utf8");

const forbidden = [
  { name: "eval(", pattern: /(^|[^\w$.])eval\(/g },
  { name: "new Function(", pattern: /new\s+Function\(/g },
  { name: ".constructor(", pattern: /\.constructor\(/g },
];

// lodash.get ends `freeGlobal || freeSelf || Function('return this')()`. It is unreachable in
// browsers because `self` is always defined there, so a `Function(` right after `||` is allowed.
const bareFunction = /(^|[^\w$.])Function\(/g;
const allowedFunction = /\|\|\s*Function\(/g;

const failures = forbidden
  .map(({ name, pattern }) => ({ name, count: (source.match(pattern) || []).length }))
  .filter(({ count }) => count > 0);

const bareCount = (source.match(bareFunction) || []).length;
const allowedCount = (source.match(allowedFunction) || []).length;
if (bareCount > allowedCount) {
  failures.push({ name: "Function(", count: bareCount - allowedCount });
}

if (failures.length > 0) {
  for (const { name, count } of failures) {
    console.error(`${bundlePath}: ${count} occurrence(s) of ${name}`);
  }
  process.exit(1);
}

console.log(
  `${bundlePath}: no string-evaluation sinks (${allowedCount} unreachable lodash fallback)`,
);
