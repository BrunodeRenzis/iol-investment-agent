import type { ReadStream, WriteStream } from 'node:tty';
import { IolError } from '../error';
import type { InputField, ManualIO } from './manual-runner';

const labels: Record<InputField, string> = {
  action: 'Acción (entrada oculta): ',
  username: 'Usuario IOL (entrada oculta): ',
  password: 'Contraseña IOL (entrada oculta): ',
};

/** Raw TTY only: no readline history, echo, masking, pipes or pasted commands. */
export function createTerminalIO(
  input: ReadStream,
  output: WriteStream,
): ManualIO {
  if (
    !input.isTTY ||
    !output.isTTY ||
    input.isRaw ||
    typeof input.setRawMode !== 'function'
  )
    throw new IolError('terminal_unavailable');
  return {
    write: (message) => {
      output.write(message + '\n');
    },
    readHidden: (field, signal) =>
      new Promise<string>((resolve, reject) => {
        if (signal.aborted) {
          reject(new IolError('terminal_unavailable'));
          return;
        }
        let value = '';
        let settled = false;
        const finish = (result?: string): void => {
          if (settled) return;
          settled = true;
          input.off('data', data);
          input.off('end', fail);
          input.off('close', fail);
          input.off('error', fail);
          output.off('error', fail);
          signal.removeEventListener('abort', fail);
          value = '';
          try {
            input.pause();
            input.setRawMode(false);
            output.write('\n');
          } catch {
            reject(new IolError('terminal_unavailable'));
            return;
          }
          if (result === undefined)
            reject(new IolError('terminal_unavailable'));
          else resolve(result);
        };
        const fail = (): void => finish();
        const data = (chunk: Buffer): void => {
          let text: string;
          try {
            text = new TextDecoder('utf-8', { fatal: true }).decode(chunk);
          } catch {
            fail();
            return;
          }
          // Reject paste/batched input, including pasted newlines and escape sequences.
          if ([...text].length !== 1) {
            fail();
            return;
          }
          if (text === '\r' || text === '\n') {
            finish(value);
            return;
          }
          if (text === '\x7f' || text === '\b') {
            value = [...value].slice(0, -1).join('');
            return;
          }
          if (text.charCodeAt(0) < 32) {
            fail();
            return;
          }
          value += text;
          if (
            value.length >
            (field === 'password' ? 1024 : field === 'username' ? 256 : 40)
          )
            fail();
        };
        input.on('data', data);
        input.once('end', fail);
        input.once('close', fail);
        input.once('error', fail);
        output.once('error', fail);
        signal.addEventListener('abort', fail, { once: true });
        try {
          input.setRawMode(true);
          output.write(labels[field]);
          input.resume();
        } catch {
          fail();
        }
      }),
  };
}
