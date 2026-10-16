import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { LoggerService } from '@nestjs/common';
import { createApplication } from '../src/application';
import { APP_CONFIG } from '../src/config/config.module';
import type { AppConfig } from '../src/config/environment';
import { HealthController } from '../src/modules/health/health.controller';

class RecordingLogger implements LoggerService {
  readonly messages: unknown[] = [];
  log(message: unknown): void {
    this.messages.push(message);
  }
  error(message: unknown): void {
    this.messages.push(message);
  }
  warn(message: unknown): void {
    this.messages.push(message);
  }
}

// node:test owns execution and reports failures for these top-level registrations.
void test('health controller returns only the liveness status', () => {
  assert.deepEqual(new HealthController().getHealth(), { status: 'ok' });
});

void test('invalid configuration rejects application creation before listening', async () => {
  await assert.rejects(
    createApplication({ IOL_READ_ONLY: 'false' }, new RecordingLogger()),
    /IOL_READ_ONLY/,
  );
});

void test('HTTP composition exposes health, enforces rate limits, and logs only safe metadata', async (t) => {
  const logger = new RecordingLogger();
  const app = await createApplication(
    { NODE_ENV: 'test', PORT: '4000' },
    logger,
  );
  t.after(async () => {
    await app.close();
  });
  await app.listen(0, '127.0.0.1');
  const baseUrl = await app.getUrl();

  assert.equal(app.get<AppConfig>(APP_CONFIG).port, 4000);
  assert.equal(app.getHttpServer().requestTimeout, 30_000);
  assert.equal(app.getHttpServer().headersTimeout, 15_000);

  const marker = 'test-sensitive-marker';
  const response = await fetch(`${baseUrl}/health?ignored=${marker}`, {
    headers: {
      authorization: `Bearer ${marker}`,
      cookie: `session=${marker}`,
      'x-request-id': marker,
    },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-powered-by'), null);
  const requestId = response.headers.get('x-request-id');
  assert.ok(requestId);
  assert.match(requestId, /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/);
  assert.ok(
    logger.messages.some(
      (message) =>
        typeof message === 'object' &&
        message !== null &&
        'requestId' in message &&
        message.requestId === requestId &&
        'statusCode' in message &&
        message.statusCode === 200,
    ),
  );

  for (const path of ['/orders', '/trading', '/portfolio', '/']) {
    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
      const missing = await fetch(`${baseUrl}${path}`, { method });
      assert.equal(missing.status, 404);
      await missing.text();
    }
  }
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const wrongMethod = await fetch(`${baseUrl}/health`, { method });
    assert.equal(wrongMethod.status, 404);
    await wrongMethod.text();
  }

  // The first request above consumed one of the 60 requests per minute.
  for (let index = 1; index < 60; index += 1) {
    const healthy = await fetch(`${baseUrl}/health`);
    assert.equal(healthy.status, 200);
    await healthy.text();
  }
  const limited = await fetch(`${baseUrl}/health`);
  assert.equal(limited.status, 429);
  assert.ok(limited.headers.has('retry-after'));
  const limitedBody: unknown = await limited.json();
  assert.ok(typeof limitedBody === 'object' && limitedBody !== null);
  assert.ok(!('stack' in limitedBody));
  assert.ok(!JSON.stringify(logger.messages).includes(marker));
});
