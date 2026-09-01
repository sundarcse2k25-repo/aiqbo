const esbuild = require('esbuild');
const path = require('path');

/**
 * Bundles and runs the backend (server/src/server.ts) using esbuild — the
 * same technique scripts/run-tests.cjs already uses to run TypeScript
 * directly without adding a dependency like ts-node/tsx. The bundle is
 * written to scripts/server-bundle.cjs (gitignored, like the test-runner's
 * own generated bundle) and then simply required, which starts the server.
 */
async function main() {
  const entryPath = path.resolve(__dirname, '../server/src/server.ts');
  const bundlePath = path.resolve(__dirname, 'server-bundle.cjs');

  await esbuild.build({
    entryPoints: [entryPath],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: bundlePath,
  });

  require(bundlePath);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
