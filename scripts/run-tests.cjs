const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

function findTestFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        results = results.concat(findTestFiles(filePath));
      }
    } else if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) {
      results.push(filePath);
    }
  }
  return results;
}

async function runTests() {
  console.log('\n========================================');
  console.log('  AIQBO Reporting Engine — Unit Tests   ');
  console.log('========================================\n');

  const shimFile = path.resolve(__dirname, 'test-shim.cjs');
  const shimCode = [
    'global.__testState = global.__testState || { passedCount: 0, failedCount: 0, testQueue: [] };',
    'let currentSuite = "";',
    '',
    'function describe(name, fn) {',
    '  const prev = currentSuite;',
    '  currentSuite = currentSuite ? currentSuite + " > " + name : name;',
    '  fn();',
    '  currentSuite = prev;',
    '}',
    '',
    'function it(name, fn) {',
    '  const fullName = currentSuite + " > " + name;',
    '  global.__testState.testQueue.push({ fullName, fn });',
    '}',
    '',
    'function buildMatchers(actual, negate) {',
    '  function fail(msg) {',
    '    throw new Error(negate ? "Expected NOT: " + msg : msg);',
    '  }',
    '  function check(pass, msg) {',
    '    if (negate ? pass : !pass) fail(msg);',
    '  }',
    '  return {',
    '    toBeDefined() {',
    '      check(actual !== undefined, "Expected value to be defined but received undefined");',
    '    },',
    '    toBeUndefined() {',
    '      check(actual === undefined, "Expected value to be undefined but received " + JSON.stringify(actual));',
    '    },',
    '    toBe(expected) {',
    '      check(actual === expected, "Expected " + JSON.stringify(expected) + " but received " + JSON.stringify(actual));',
    '    },',
    '    toEqual(expected) {',
    '      check(JSON.stringify(actual) === JSON.stringify(expected), "Expected " + JSON.stringify(expected) + " but received " + JSON.stringify(actual));',
    '    },',
    '    toHaveLength(expected) {',
    '      check(!!actual && actual.length === expected, "Expected length " + expected + " but received " + (actual ? actual.length : "undefined"));',
    '    },',
    '    toBeLessThan(expected) {',
    '      check(actual < expected, "Expected " + actual + " to be less than " + expected);',
    '    },',
    '    toBeGreaterThan(expected) {',
    '      check(actual > expected, "Expected " + actual + " to be greater than " + expected);',
    '    },',
    '    toThrow() {',
    '      let threw = false;',
    '      try { actual(); } catch (e) { threw = true; }',
    '      check(threw, "Expected function to throw but it did not");',
    '    },',
    '    toBeCloseTo(expected, precision) {',
    '      var p = precision === undefined ? 2 : precision;',
    '      var pass = Math.abs(actual - expected) < Math.pow(10, -p) / 2;',
    '      check(pass, "Expected " + actual + " to be close to " + expected + " (precision " + p + ")");',
    '    },',
    '    toMatch(pattern) {',
    '      const re = pattern instanceof RegExp ? pattern : new RegExp(pattern);',
    '      check(typeof actual === "string" && re.test(actual), "Expected " + JSON.stringify(actual) + " to match " + pattern);',
    '    },',
    '    toContain(expected) {',
    '      var pass = actual !== null && actual !== undefined && (typeof actual === "string" || Array.isArray(actual)) && actual.indexOf(expected) !== -1;',
    '      check(pass, "Expected " + JSON.stringify(actual) + " to contain " + JSON.stringify(expected));',
    '    },',
    '    toBeNull() {',
    '      check(actual === null, "Expected value to be null but received " + JSON.stringify(actual));',
    '    },',
    '  };',
    '}',
    '',
    'function expect(actual) {',
    '  const matchers = buildMatchers(actual, false);',
    '  matchers.not = buildMatchers(actual, true);',
    '  return matchers;',
    '}',
    '',
    'module.exports = { describe, it, expect };',
  ].join('\n');

  fs.writeFileSync(shimFile, shimCode);

  const serverSrcDir = path.resolve(__dirname, '../server/src');
  const testFiles = [
    ...findTestFiles(path.resolve(__dirname, '../src')),
    ...(fs.existsSync(serverSrcDir) ? findTestFiles(serverSrcDir) : []),
  ];
  const bundlePath = path.resolve(__dirname, 'test-bundle.cjs');

  try {
    // Bundle entry containing all test files
    const entryContent = testFiles.map((f) => `require(${JSON.stringify(f)});`).join('\n');
    const entryPath = path.resolve(__dirname, 'test-entry.ts');
    fs.writeFileSync(entryPath, entryContent);

    await esbuild.build({
      entryPoints: [entryPath],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: bundlePath,
      alias: {
        '@': path.resolve(__dirname, '../src'),
        'vitest': shimFile,
      },
    });

    try { fs.unlinkSync(entryPath); } catch (_) {}

    // Load bundle to register all tests
    require(bundlePath);

    // Execute test queue sequentially (supporting async/await)
    for (const test of global.__testState.testQueue) {
      try {
        await Promise.resolve(test.fn());
        global.__testState.passedCount++;
        console.log('  ✓ PASS: ' + test.fullName);
      } catch (err) {
        global.__testState.failedCount++;
        console.error('  ✗ FAIL: ' + test.fullName);
        console.error('    ' + (err.stack || err.message));
      }
    }

    const { passedCount, failedCount } = global.__testState;
    console.log('\n----------------------------------------');
    console.log(`Test Summary: ${passedCount} passed, ${failedCount} failed (${passedCount + failedCount} total)`);
    console.log('----------------------------------------\n');

    if (failedCount > 0) {
      process.exit(1);
    }
  } finally {
    try { if (fs.existsSync(shimFile)) fs.unlinkSync(shimFile); } catch (_) {}
    try { if (fs.existsSync(bundlePath)) fs.unlinkSync(bundlePath); } catch (_) {}
  }
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
