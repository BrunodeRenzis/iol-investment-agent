import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import { discoverTests } from './test-discovery.mjs';

const projectRoot = resolve(fileURLToPath(new URL('../', import.meta.url)));
const testOutput = join(projectRoot, '.test-dist');

// The deletion target is fixed inside this project, never supplied by a caller.
if (dirname(testOutput) !== projectRoot) {
  throw new Error('Test output must be directly inside the project root');
}
rmSync(testOutput, { recursive: true, force: true });

const compilation = spawnSync(
  process.execPath,
  [
    join(projectRoot, 'node_modules/typescript/bin/tsc'),
    '-p',
    'tsconfig.test.json',
  ],
  { cwd: projectRoot, stdio: 'inherit' },
);
if (compilation.error) throw compilation.error;
if (compilation.status !== 0) process.exit(compilation.status ?? 1);

const tests = spawnSync(
  process.execPath,
  [join(projectRoot, 'scripts/run-compiled-tests.mjs'), testOutput],
  { cwd: projectRoot, stdio: 'inherit' },
);
if (tests.error) throw tests.error;
if (tests.status !== 0) process.exit(tests.status ?? 1);

// Tooling tests are separate so they cannot mask an empty application suite.
const toolingFiles = discoverTests(
  join(projectRoot, 'scripts/test'),
  '.test.mjs',
);
if (toolingFiles.length === 0) throw new Error('No tooling tests found');
const tooling = spawnSync(process.execPath, ['--test', ...toolingFiles], {
  cwd: projectRoot,
  stdio: 'inherit',
});
if (tooling.error) throw tooling.error;
process.exitCode = tooling.status ?? 1;
