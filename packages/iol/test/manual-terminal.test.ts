import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import type { ReadStream, WriteStream } from 'node:tty';
import { test } from 'node:test';
import { createTerminalIO } from '../src/internal/manual-terminal';
import {
  runManualVerification,
  type ManualIO,
} from '../src/internal/manual-runner';
import { instrumentFixture } from './fixtures';

function terminal() {
  const modes: boolean[] = [];
  const input = Object.assign(new PassThrough(), {
    isTTY: true,
    isRaw: false,
    setRawMode(mode: boolean) {
      this.isRaw = mode;
      modes.push(mode);
      return this;
    },
  });
  const output = Object.assign(new PassThrough(), { isTTY: true });
  let text = '';
  output.on('data', (chunk: Buffer) => {
    text += chunk.toString();
  });
  const io = createTerminalIO(
    input as unknown as ReadStream,
    output as unknown as WriteStream,
  );
  return { io, input, output, modes, text: () => text };
}

for (const enter of ['\r', '\n'])
  void test(`hidden terminal action 1 with ${JSON.stringify(enter)} reaches the instrument mock once after simulated login`, async () => {
    const tty = terminal();
    const inputs = [
      'AUTENTICAR SESION APROBADA',
      'synthetic-user',
      'synthetic-password',
      '1',
      'salir',
    ];
    const io: ManualIO = {
      write: (message) => tty.io.write(message),
      readHidden: (field, signal) => {
        const value = inputs.shift();
        assert.notEqual(value, undefined);
        const result = tty.io.readHidden(field, signal);
        for (const char of value!) tty.input.emit('data', Buffer.from(char));
        tty.input.emit('data', Buffer.from(enter));
        return result;
      },
    };
    const calls: { method: string | undefined; url: unknown }[] = [];
    const ok = await runManualVerification(
      io,
      (url, init) => {
        calls.push({ method: init?.method, url });
        return Promise.resolve(
          new Response(
            init?.method === 'POST'
              ? '{"access_token":"synthetic-terminal-access","token_type":"bearer","expires_in":900}'
              : instrumentFixture,
            { headers: { 'content-type': 'application/json' } },
          ),
        );
      },
      [],
      [],
      new AbortController().signal,
      () => undefined,
    );
    assert.equal(ok, true);
    assert.deepEqual(calls, [
      { method: 'POST', url: 'https://api.invertironline.com/token' },
      {
        method: 'GET',
        url: 'https://api.invertironline.com/api/v2/bCBA/Titulos/AL30',
      },
    ]);
    assert.equal(tty.input.isRaw, false);
    assert.equal(tty.input.listenerCount('data'), 0);
    assert.ok(!tty.text().includes('synthetic-'));
  });
void test('username and password use raw hidden input without echo or serialization', async () => {
  for (const field of ['username', 'password'] as const) {
    const tty = terminal();
    const result = tty.io.readHidden(field, new AbortController().signal);
    for (const char of 'synthetic-secret')
      tty.input.emit('data', Buffer.from(char));
    tty.input.emit('data', Buffer.from('\r'));
    assert.equal(await result, 'synthetic-secret');
    assert.ok(!tty.text().includes('synthetic-secret'));
    assert.deepEqual(tty.modes, [true, false]);
    assert.equal(tty.input.listenerCount('data'), 0);
  }
});
void test('paste, control keys, malformed UTF-8 and cancel restore the terminal and fail closed', async () => {
  for (const chunk of [
    Buffer.from('pasted-secret\r1\r'),
    Buffer.from('\x03'),
    Buffer.from('\x04'),
    Buffer.from('\x1b[A'),
    Buffer.from([255]),
  ]) {
    const tty = terminal();
    const assertion = assert.rejects(
      tty.io.readHidden('password', new AbortController().signal),
    );
    tty.input.emit('data', chunk);
    await assertion;
    assert.deepEqual(tty.modes, [true, false]);
    assert.equal(tty.input.listenerCount('data'), 0);
    assert.ok(!tty.text().includes('pasted-secret'));
  }
  const tty = terminal();
  const stop = new AbortController();
  const assertion = assert.rejects(tty.io.readHidden('password', stop.signal));
  stop.abort();
  await assertion;
  assert.equal(tty.input.isRaw, false);
});
void test('input length is bounded and backspace does not echo', async () => {
  const tty = terminal();
  const result = tty.io.readHidden('username', new AbortController().signal);
  for (const char of ['a', 'b', '\x7f', 'c', '\r'])
    tty.input.emit('data', Buffer.from(char));
  assert.equal(await result, 'ac');
  const assertion = assert.rejects(
    tty.io.readHidden('action', new AbortController().signal),
  );
  for (let i = 0; i < 41; i++) tty.input.emit('data', Buffer.from('x'));
  await assertion;
  assert.equal(tty.input.isRaw, false);
});
void test('non-TTY input or redirected output is refused before prompting', () => {
  const tty = terminal();
  tty.input.isTTY = false;
  assert.throws(() =>
    createTerminalIO(
      tty.input as unknown as ReadStream,
      tty.output as unknown as WriteStream,
    ),
  );
  tty.input.isTTY = true;
  tty.output.isTTY = false;
  assert.throws(() =>
    createTerminalIO(
      tty.input as unknown as ReadStream,
      tty.output as unknown as WriteStream,
    ),
  );
});

void test('terminal errors are sanitized and detach listeners even if mode setup fails', async () => {
  const tty = terminal();
  const assertion = assert.rejects(
    tty.io.readHidden('password', new AbortController().signal),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.ok(!error.message.includes('synthetic-terminal-secret'));
      assert.equal('cause' in error, false);
      return true;
    },
  );
  tty.output.emit('error', new Error('synthetic-terminal-secret'));
  await assertion;
  assert.equal(tty.input.isRaw, false);
  assert.equal(tty.input.listenerCount('data'), 0);
  tty.input.setRawMode = () => {
    throw new Error('synthetic-terminal-secret');
  };
  await assert.rejects(
    tty.io.readHidden('password', new AbortController().signal),
    { message: 'IOL adapter: terminal_unavailable' },
  );
  assert.equal(tty.input.listenerCount('data'), 0);
});
