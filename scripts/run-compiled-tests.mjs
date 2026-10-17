import { spawnSync } from 'node:child_process';
import console from 'node:console';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { discoverTests } from './test-discovery.mjs';

// A separate entry point allows the zero-test guard to be exercised in scratch
// output trees, without modifying application tests or the real build output.
if (process.argv.length !== 3) {
  console.error('Usage: node scripts/run-compiled-tests.mjs <compiled-output>');
  process.exit(1);
}
const output = resolve(process.argv[2]);
const files = ['apps', 'packages'].flatMap((scope) =>
  discoverTests(join(output, scope)),
);
if (files.length === 0) {
  console.error('No compiled *.test.js files found under apps/ or packages/.');
  process.exit(1);
}
const tests = spawnSync(process.execPath, ['--test', ...files], {
  cwd: output,
  stdio: 'inherit',
});
if (tests.error) throw tests.error;
process.exitCode = tests.status ?? 1;
