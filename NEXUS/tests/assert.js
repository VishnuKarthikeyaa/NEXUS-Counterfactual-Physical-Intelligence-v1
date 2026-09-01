export function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message ?? "Assertion failed"}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertTrue(value, message) {
  if (!value) throw new Error(message ?? "Expected value to be truthy");
}

export function assertGreaterThan(actual, floor, message) {
  if (!(actual > floor)) {
    throw new Error(`${message ?? "Assertion failed"}: expected ${actual} > ${floor}`);
  }
}
