import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

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

// Node recursively discovers *.test.js within the freshly compiled tree.
const tests = spawnSync(process.execPath, ['--test'], {
  cwd: testOutput,
  stdio: 'inherit',
});
if (tests.error) throw tests.error;
process.exitCode = tests.status ?? 1;
