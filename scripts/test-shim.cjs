global.__testState = global.__testState || { passedCount: 0, failedCount: 0, testQueue: [] };
let currentSuite = "";

function describe(name, fn) {
  const prev = currentSuite;
  currentSuite = currentSuite ? currentSuite + " > " + name : name;
  fn();
  currentSuite = prev;
}

function it(name, fn) {
  const fullName = currentSuite + " > " + name;
  global.__testState.testQueue.push({ fullName, fn });
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error("Expected " + JSON.stringify(expected) + " but received " + JSON.stringify(actual));
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error("Expected " + JSON.stringify(expected) + " but received " + JSON.stringify(actual));
      }
    },
    toHaveLength(expected) {
      if (!actual || actual.length !== expected) {
        throw new Error("Expected length " + expected + " but received " + (actual ? actual.length : "undefined"));
      }
    },
  };
}

module.exports = { describe, it, expect };