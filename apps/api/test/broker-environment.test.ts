import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateEnvironment } from '../src/config/environment';

void test('API rejects broker environment and configurable origins without echoing any value', () => {
  for (const name of [
    'IOL_USERNAME',
    'IOL_PASSWORD',
    'IOL_ACCESS_TOKEN',
    'IOL_REFRESH_TOKEN',
    'IOL_CLIENT_ID',
    'IOL_CLIENT_SECRET',
    'IOL_BASE_URL',
    'IOL_AUTH_URL',
    'iol_password',
  ]) {
    for (const value of ['', 'synthetic-forbidden-value']) {
      assert.throws(
        () => validateEnvironment({ [name]: value }),
        (error: unknown) => {
          assert.ok(error instanceof Error);
          assert.ok(!error.message.includes('synthetic-forbidden-value'));
          assert.ok(!error.message.includes(name));
          return true;
        },
      );
    }
  }
  assert.equal(
    validateEnvironment({
      IOL_READ_ONLY: 'true',
      HOST: '127.0.0.1',
      PORT: '3000',
    }).readOnly,
    true,
  );
});
