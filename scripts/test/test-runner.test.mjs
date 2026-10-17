import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { fileURLToPath, URL } from 'node:url';

const runner = fileURLToPath(
  new URL('../run-compiled-tests.mjs', import.meta.url),
);

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'iol-test-runner-'));
  // Only remove the scratch directory created by this test.
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return {
    write(path, content) {
      const target = join(root, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content);
    },
    run() {
      // Launch a fresh CLI, not a nested worker in this parent Node test run.
      const env = { ...process.env };
      delete env.NODE_TEST_CONTEXT;
      const result = spawnSync(process.execPath, [runner, root], {
        encoding: 'utf8',
        env,
      });
      assert.ifError(result.error);
      return result;
    },
  };
}

void test('compiled runner fails on zero tests, even with helper/default-discovery files', (t) => {
  const tree = fixture(t);
  tree.write('apps/api/test/helper.js', 'throw new Error("HELPER_EXECUTED");');
  tree.write('packages/example/test.js', 'throw new Error("HELPER_EXECUTED");');
  tree.write('outside.test.js', 'throw new Error("OUTSIDE_EXECUTED");');
  const result = tree.run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /No compiled \*\.test\.js files/);
  assert.doesNotMatch(
    result.stdout + result.stderr,
    /HELPER_EXECUTED|OUTSIDE_EXECUTED/,
  );
});

void test('compiled runner explicitly executes nested app and package tests, excluding helpers', (t) => {
  const tree = fixture(t);
  tree.write(
    'apps/api/test/nested/app.test.js',
    "require('node:test')('app fixture', () => {});",
  );
  tree.write(
    'packages/example/nested/package space.test.js',
    "require('node:test')('package fixture', () => {});",
  );
  tree.write('apps/api/test/helper.js', 'throw new Error("HELPER_EXECUTED");');
  tree.write('packages/example/test.js', 'throw new Error("HELPER_EXECUTED");');
  const result = tree.run();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /app fixture/);
  assert.match(result.stdout, /package fixture/);
  assert.doesNotMatch(result.stdout + result.stderr, /HELPER_EXECUTED/);
});

void test('compiled runner propagates package test failures even without an apps directory', (t) => {
  const tree = fixture(t);
  tree.write(
    'packages/example/failure.test.js',
    'throw new Error("EXPECTED_TEST_FAILURE");',
  );
  const result = tree.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /EXPECTED_TEST_FAILURE/);
});
