import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import { PasswordGrantCredentials } from '../src/internal/manual-auth';
import { AuthenticatedReadTransport } from '../src/internal/transport';
import { makeRequest } from '../src/internal/allowlist';

async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
async function close(server: Server): Promise<void> {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}
void test('native fetch never forwards read Authorization or token form through 301/302/303/307/308 (loopback only)', async () => {
  let targetCalls = 0;
  const target = createServer((_request, response) => {
    targetCalls++;
    response.end('{}');
  });
  const targetUrl = await listen(target);
  let status = 301;
  let sourceCalls = 0;
  const requests: {
    method: string | undefined;
    authorization: string | undefined;
    body: string;
  }[] = [];
  const source = createServer((request, response) => {
    sourceCalls++;
    let body = '';
    request.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });
    request.on('end', () => {
      requests.push({
        method: request.method,
        authorization: request.headers.authorization,
        body,
      });
      response.writeHead(status, { location: targetUrl });
      response.end();
    });
  });
  const sourceUrl = await listen(source);
  // Test-only routing seam: native fetch receives ONLY a loopback URL.
  // Production origin/method validation still runs before this injected fetch.
  const localFetch: typeof fetch = (input, init) => {
    assert.ok(
      input === 'https://api.invertironline.com/token' ||
        input === 'https://api.invertironline.com/api/v2/estadocuenta',
    );
    return fetch(sourceUrl, init);
  };
  try {
    for (status of [301, 302, 303, 307, 308]) {
      const transport = new AuthenticatedReadTransport(
        'synthetic-local-access',
        localFetch,
      );
      await assert.rejects(transport.read(makeRequest('accountState')), {
        code: 'redirect_rejected',
      });
      transport.dispose();
      const credentials = new PasswordGrantCredentials(
        'synthetic-local-user',
        'synthetic-local-password',
      );
      await assert.rejects(
        credentials.authenticate(localFetch, new AbortController().signal),
        { code: 'redirect_rejected' },
      );
    }
    assert.equal(sourceCalls, 10);
    assert.equal(targetCalls, 0);
    assert.equal(
      requests.filter(
        (r) =>
          r.method === 'GET' &&
          r.authorization === 'Bearer synthetic-local-access',
      ).length,
      5,
    );
    assert.equal(
      requests.filter(
        (r) =>
          r.method === 'POST' &&
          r.authorization === undefined &&
          new URLSearchParams(r.body).get('password') ===
            'synthetic-local-password',
      ).length,
      5,
    );
  } finally {
    await close(source);
    await close(target);
  }
});
