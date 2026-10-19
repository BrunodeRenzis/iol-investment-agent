import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createOfflineIolAdapter } from '../src';
import {
  accountSummary,
  portfolioSummary,
  quoteSummary,
} from '../src/internal/manual-summary';
import { instrumentFixture, quoteFixture } from './fixtures';

function noCounts(value: unknown): void {
  assert.notEqual(typeof value, 'number');
  if (Array.isArray(value))
    for (const item of value as unknown[]) noCounts(item);
  else if (value && typeof value === 'object')
    for (const [key, item] of Object.entries(value)) {
      assert.ok(!/(?:Count$|^count$)/i.test(key));
      noCounts(item);
    }
}
void test('summary cannot distinguish one versus many accounts/holdings and exposes no exact count', async () => {
  const results: string[][] = [];
  for (const count of [1, 9]) {
    const accounts = Array<string>(count)
      .fill(
        '{"tipo":"inversion_Argentina_Pesos","moneda":"peso_Argentino","saldo":123456.789}',
      )
      .join(',');
    const holdings = Array<string>(count)
      .fill(`{"titulo":${instrumentFixture},"cantidad":987654.321}`)
      .join(',');
    const adapter = createOfflineIolAdapter({
      accountState: `{"cuentas":[${accounts}]}`,
      portfolio: `{"pais":"argentina","activos":[${holdings}]}`,
      quoteDetail: quoteFixture,
    });
    const summaries = [
      accountSummary(await adapter.getAccountState()),
      portfolioSummary(await adapter.getPortfolio('argentina')),
      quoteSummary(await adapter.getQuoteDetail('bCBA', 'AL30')),
    ];
    for (const summary of summaries) {
      noCounts(JSON.parse(summary) as unknown);
      assert.doesNotMatch(summary, /123456|987654|AL30/);
    }
    results.push(summaries);
  }
  assert.deepEqual(results[0], results[1]);
});
