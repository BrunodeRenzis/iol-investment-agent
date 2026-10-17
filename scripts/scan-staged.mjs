import { spawnSync } from 'node:child_process';
import console from 'node:console';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL, URL } from 'node:url';

const version = '8.30.1'; // Match the reviewed version pinned in CI.
const projectRoot = fileURLToPath(new URL('../', import.meta.url));

export function scanStaged({
  executable = process.env.GITLEAKS_PATH || 'gitleaks',
  cwd = projectRoot,
  run = spawnSync,
  report = console.error,
} = {}) {
  const installed = run(executable, ['version'], { cwd, encoding: 'utf8' });
  if (installed.error || installed.status !== 0) {
    report(
      `Gitleaks ${version} is required. Install the verified release manually and set GITLEAKS_PATH or use PATH; see README.md.`,
    );
    return 1;
  }
  if (installed.stdout.trim() !== version) {
    report(`Use Gitleaks ${version}, matching CI. No scan was performed.`);
    return 1;
  }

  // Gitleaks reads git diff --staged. No hooks, index writes, shell interpolation,
  // downloaded executables, or unredacted finding reports are introduced here.
  const scan = run(
    executable,
    ['git', '--staged', '--redact=100', '--no-banner', '--exit-code=1', '.'],
    { cwd, stdio: 'inherit' },
  );
  if (scan.error || scan.status === null) {
    report(
      'Staged secret scan could not complete; check Git/Gitleaks availability.',
    );
    return 1;
  }
  return scan.status;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  process.exitCode = scanStaged();
}
