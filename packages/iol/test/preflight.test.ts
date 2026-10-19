import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { test } from 'node:test';
import { validateManualRuntime } from '../src/internal/manual-preflight';

const blocked = [
  'NODE_OPTIONS',
  'NODE_TLS_REJECT_UNAUTHORIZED',
  'NODE_EXTRA_CA_CERTS',
  'NODE_USE_ENV_PROXY',
  'HTTPS_PROXY',
  'HTTP_PROXY',
  'ALL_PROXY',
  'NODE_V8_COVERAGE',
  'SSLKEYLOGFILE',
  'NODE_REDIRECT_WARNINGS',
  'VSCODE_INSPECTOR_OPTIONS',
  'VSCODE_JS_DEBUG_OPTIONS',
];
for (const key of blocked)
  void test(`runtime rejects ${key} presence including empty/lowercase aliases without reading values`, () => {
    for (const name of [key, key.toLowerCase()]) {
      const environment = Object.defineProperty({}, name, {
        enumerable: true,
        get: () => {
          throw new Error('VALUE_MUST_NOT_BE_READ');
        },
      });
      assert.throws(
        () => validateManualRuntime(Object.keys(environment), [], false),
        (error: unknown) => {
          assert.ok(error instanceof Error);
          assert.equal(error.message, 'IOL adapter: runtime_rejected');
          assert.ok(!inspect(error).includes(name));
          assert.ok(!JSON.stringify(error).includes('VALUE_MUST_NOT_BE_READ'));
          return true;
        },
      );
    }
  });
void test('active inspector is refused independently of arguments', () => {
  assert.throws(() => validateManualRuntime([], [], true), {
    code: 'runtime_rejected',
  });
  assert.doesNotThrow(() => validateManualRuntime(['PATH', 'TEMP'], [], false));
});
void test('debug, preload, import, loader, TLS and other explicit Node options fail closed without echo', () => {
  for (const args of [
    ['--inspect'],
    ['--inspect-brk=127.0.0.1:9229'],
    ['--require', 'SYNTHETIC_PRIVATE_PATH'],
    ['-rSYNTHETIC_PRIVATE_PATH'],
    ['--import=SYNTHETIC_PRIVATE_PATH'],
    ['--loader', 'SYNTHETIC_PRIVATE_PATH'],
    ['--experimental-loader=SYNTHETIC_PRIVATE_PATH'],
    ['--env-file=.env'],
    ['--tls-keylog=SYNTHETIC_PRIVATE_PATH'],
  ]) {
    assert.throws(
      () => validateManualRuntime([], args, false),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, 'IOL adapter: runtime_rejected');
        assert.ok(!inspect(error).includes('SYNTHETIC_PRIVATE_PATH'));
        return true;
      },
    );
  }
});
