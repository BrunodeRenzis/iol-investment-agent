import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateEnvironment } from '../src/config/environment';

// node:test owns execution and reports failures for these top-level registrations.
void test('defaults are local, read-only, and immutable without credentials', () => {
  const config = validateEnvironment({});
  assert.deepEqual(config, {
    nodeEnv: 'development',
    host: '127.0.0.1',
    port: 3000,
    readOnly: true,
  });
  assert.equal(Object.isFrozen(config), true);
});

void test('accepts supported environments and port boundaries', () => {
  for (const nodeEnv of ['development', 'test', 'production']) {
    for (const port of ['1', '4000', '65535']) {
      assert.deepEqual(
        validateEnvironment({
          NODE_ENV: nodeEnv,
          PORT: port,
          IOL_READ_ONLY: 'true',
        }),
        {
          nodeEnv,
          host: '127.0.0.1',
          port: Number(port),
          readOnly: true,
        },
      );
    }
  }
});

void test('rejects malformed and out-of-range ports', () => {
  for (const port of [
    '',
    '0',
    '-1',
    '65536',
    '3000.5',
    '3000abc',
    '1e3',
    ' 3000 ',
    'Infinity',
    'NaN',
    '99999999999999999999',
  ]) {
    assert.throws(
      () => validateEnvironment({ PORT: port }),
      /PORT must be an integer from 1 to 65535/,
    );
  }
});

void test('rejects unsupported environments and non-loopback binding', () => {
  for (const nodeEnv of ['', 'staging', 'TEST']) {
    assert.throws(() => validateEnvironment({ NODE_ENV: nodeEnv }), /NODE_ENV/);
  }
  for (const host of ['', '0.0.0.0', 'example.com']) {
    assert.throws(() => validateEnvironment({ HOST: host }), /HOST/);
  }
});

void test('fails closed on attempts to disable or ambiguously configure read-only mode', () => {
  for (const value of ['false', '', '0', '1', 'TRUE', ' true ']) {
    assert.throws(
      () => validateEnvironment({ IOL_READ_ONLY: value }),
      /IOL_READ_ONLY must be true/,
    );
  }
});

void test('configuration errors never echo supplied values', () => {
  const marker = 'test-sensitive-marker';
  for (const key of ['NODE_ENV', 'PORT', 'HOST', 'IOL_READ_ONLY']) {
    assert.throws(
      () => validateEnvironment({ [key]: marker }),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.ok(error.message.includes(key));
        assert.ok(!error.message.includes(marker));
        return true;
      },
    );
  }
});

void test('unrelated environment variables do not enter application configuration', () => {
  assert.deepEqual(
    validateEnvironment({ UNRELATED_SETTING: 'ignored' }),
    validateEnvironment({}),
  );
});
