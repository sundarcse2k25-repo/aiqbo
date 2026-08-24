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
    'function expect(actual) {',
    '    toBeDefined() {',
    '      if (actual === undefined) {',
    '        throw new Error("Expected value to be defined but received undefined");',
    '      }',
    '    },',
    '    toBe(expected) {',
    '      if (actual !== expected) {',
    '        throw new Error("Expected " + JSON.stringify(expected) + " but received " + JSON.stringify(actual));',
    '      }',
    '    },',
    '    toEqual(expected) {',
    '      if (JSON.stringify(actual) !== JSON.stringify(expected)) {',
    '        throw new Error("Expected " + JSON.stringify(expected) + " but received " + JSON.stringify(actual));',
    '      }',
    '    },',
    '    toHaveLength(expected) {',
    '      if (!actual || actual.length !== expected) {',
    '        throw new Error("Expected length " + expected + " but received " + (actual ? actual.length : "undefined"));',
    '      }',
    '    },',
    '  };',
    '}',
    '',
    'module.exports = { describe, it, expect };',
  ].join('\n');

  fs.writeFileSync(shimFile, shimCode);

  const testFiles = findTestFiles(path.resolve(__dirname, '../src'));
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
