import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import ts from 'typescript';

// The harness runs from .test-dist; resolve the original repository explicitly.
const root = resolve(__dirname, '../../../..');
function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (
      entry.isSymbolicLink() ||
      ['node_modules', 'dist', 'test'].includes(entry.name)
    )
      return [];
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(path)
      : entry.isFile() && entry.name.endsWith('.ts')
        ? [path]
        : [];
  });
}
void test('other production packages and API cannot import IOL credential/transport internals', () => {
  const files = [
    ...sourceFiles(join(root, 'apps')),
    ...sourceFiles(join(root, 'packages')),
  ];
  assert.ok(files.length > 0);
  for (const file of files) {
    if (relative(join(root, 'packages/iol'), file).startsWith('..') === false)
      continue;
    const tree = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    function visit(node: ts.Node): void {
      if (
        ts.isStringLiteral(node) &&
        /iol[\\/]|manual-auth|manual-runner|AuthenticatedReadTransport|PasswordGrantCredentials/.test(
          node.text,
        )
      ) {
        assert.fail(
          `Internal IOL import/reference outside package: ${relative(root, file)}`,
        );
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
  }
});
void test('only defensive preflight can inspect environment names; no credential environment/file loading', () => {
  const files = sourceFiles(resolve(root, 'packages/iol/src'));
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    if (
      file === resolve(root, 'packages/iol/src/internal/manual-preflight.ts')
    ) {
      const tree = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
      );
      let environmentReads = 0;
      function visit(node: ts.Node): void {
        if (
          ts.isPropertyAccessExpression(node) &&
          node.expression.getText(tree) === 'process' &&
          node.name.text === 'env'
        ) {
          environmentReads++;
          assert.ok(ts.isCallExpression(node.parent));
          assert.equal(node.parent.expression.getText(tree), 'Object.keys');
          assert.equal(node.parent.arguments.length, 1);
        }
        ts.forEachChild(node, visit);
      }
      visit(tree);
      assert.equal(environmentReads, 1);
      assert.doesNotMatch(
        source,
        /process\s*\[|dotenv|node:fs|node:child_process/,
      );
      continue;
    }
    assert.doesNotMatch(
      source,
      /process\s*(?:\.env|\[\s*['"]env['"]\s*\])|dotenv|node:fs|node:child_process/,
    );
  }
  const publicSource = readFileSync(
    join(root, 'packages/iol/src/index.ts'),
    'utf8',
  );
  assert.doesNotMatch(publicSource, /manual|credential|token|transport/i);
  const requireHere = createRequire(__filename);
  for (const subpath of [
    'internal/manual-auth',
    'internal/manual-runner',
    'internal/transport',
    'manual',
  ]) {
    assert.throws(() => requireHere.resolve(`@iol-agent/iol/${subpath}`), {
      code: 'ERR_PACKAGE_PATH_NOT_EXPORTED',
    });
  }
  const example = readFileSync(join(root, '.env.example'), 'utf8');
  assert.deepEqual(
    example.split(/\r?\n/).filter((line) => /^IOL_/.test(line)),
    ['IOL_READ_ONLY=true'],
  );
});
