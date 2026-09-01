/**
 * Minimal zero-dependency test runner.
 * Usage: node tests/run-tests.js
 * Each *.test.js file default-exports an array of { name, fn } cases.
 */
import { pathToFileURL } from "node:url";
import path from "node:path";

const testFiles = [
  "./evaluator/evaluator.test.js",
  "./world_state/world_state.test.js",
  "./decision/decision.test.js",
];

let passed = 0;
let failed = 0;

for (const relPath of testFiles) {
  const fullPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), relPath);
  const mod = await import(pathToFileURL(fullPath).href);
  const cases = mod.default;
  for (const { name, fn } of cases) {
    try {
      await fn();
      console.log(`  ok  - ${relPath} :: ${name}`);
      passed += 1;
    } catch (err) {
      console.error(`FAIL  - ${relPath} :: ${name}`);
      console.error(`        ${err.message}`);
      failed += 1;
    }
  }
}

console.log("");
console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
