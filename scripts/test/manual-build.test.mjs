import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { URL } from 'node:url';

const manifest = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
);
void test('actual manual npm command rebuilds stale output and never executes it when build fails (offline scratch workspace)', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'iol-manual-build-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  function write(path, value) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, value);
  }
  write(
    'package.json',
    JSON.stringify({
      private: true,
      workspaces: ['packages/*'],
      scripts: { 'iol:verify:manual': manifest.scripts['iol:verify:manual'] },
    }),
  );
  write(
    'packages/iol/package.json',
    JSON.stringify({
      name: '@iol-agent/iol',
      scripts: { build: 'node build.cjs' },
    }),
  );
  write('packages/iol/dist/manual.js', 'console.log("STALE_RUNNER_EXECUTED");');
  write(
    'packages/iol/build.cjs',
    `require('node:fs').writeFileSync('dist/manual.js', ${JSON.stringify('console.log("FRESH_RUNNER_EXECUTED");')});`,
  );
  assert.ok(process.env.npm_execpath, 'Run tooling tests through npm test');
  const run = () => {
    const env = {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      ComSpec: process.env.ComSpec,
      PATHEXT: process.env.PATHEXT,
      TEMP: root,
      TMP: root,
      npm_config_cache: join(root, 'npm-cache'),
      npm_config_offline: 'true',
      npm_config_audit: 'false',
      npm_config_update_notifier: 'false',
    };
    const result = spawnSync(
      process.execPath,
      [process.env.npm_execpath, 'run', 'iol:verify:manual'],
      { cwd: root, env, encoding: 'utf8', timeout: 30_000 },
    );
    assert.ifError(result.error);
    return result;
  };
  const fresh = run();
  assert.equal(fresh.status, 0, fresh.stdout + fresh.stderr);
  assert.match(fresh.stdout, /FRESH_RUNNER_EXECUTED/);
  assert.doesNotMatch(fresh.stdout, /STALE_RUNNER_EXECUTED/);
  write('packages/iol/dist/manual.js', 'console.log("STALE_RUNNER_EXECUTED");');
  write('packages/iol/build.cjs', 'process.exitCode = 1;');
  const failed = run();
  assert.notEqual(failed.status, 0);
  assert.doesNotMatch(
    failed.stdout + failed.stderr,
    /STALE_RUNNER_EXECUTED|FRESH_RUNNER_EXECUTED/,
  );
});
