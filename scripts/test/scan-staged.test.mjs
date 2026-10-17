import assert from 'node:assert/strict';
import test from 'node:test';
import { scanStaged } from '../scan-staged.mjs';

void test('manual scanner uses staged diff and full redaction without a shell', () => {
  const calls = [];
  const status = scanStaged({
    executable: 'explicit-gitleaks',
    cwd: 'fixture-repository',
    run(...args) {
      calls.push(args);
      return calls.length === 1
        ? { status: 0, stdout: '8.30.1\n' }
        : { status: 0 };
    },
  });
  assert.equal(status, 0);
  assert.deepEqual(calls, [
    [
      'explicit-gitleaks',
      ['version'],
      { cwd: 'fixture-repository', encoding: 'utf8' },
    ],
    [
      'explicit-gitleaks',
      ['git', '--staged', '--redact=100', '--no-banner', '--exit-code=1', '.'],
      { cwd: 'fixture-repository', stdio: 'inherit' },
    ],
  ]);
});

void test('missing, broken, or mismatched Gitleaks fails closed without starting a scan', () => {
  for (const result of [
    { error: new Error('unavailable'), status: null },
    { status: 1, stdout: '' },
    { status: 0, stdout: '8.0.0\n' },
  ]) {
    let calls = 0;
    const messages = [];
    assert.equal(
      scanStaged({
        run() {
          calls++;
          return result;
        },
        report: (message) => messages.push(message),
      }),
      1,
    );
    assert.equal(calls, 1);
    assert.equal(messages.length, 1);
    assert.match(messages[0], /8\.30\.1/);
  }
});

void test('scanner propagates findings/errors and fails on interrupted execution', () => {
  for (const result of [
    { status: 1 },
    { status: 2 },
    { status: null, signal: 'SIGTERM' },
    { status: null, error: new Error('failed') },
  ]) {
    let calls = 0;
    const status = scanStaged({
      run() {
        return ++calls === 1 ? { status: 0, stdout: '8.30.1' } : result;
      },
      report() {},
    });
    assert.equal(status, result.status ?? 1);
    assert.equal(calls, 2);
  }
});
