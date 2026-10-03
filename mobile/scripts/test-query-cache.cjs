// Run with node scripts/test-query-cache.cjs; uses the existing TypeScript install.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/utils/queryCache.ts'), 'utf8');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  { exports: exportsObject, Map, Set, Promise });
const { readQuery, refreshQuery, invalidateQueries, clearQueryCache, subscribeQuery } = exportsObject;
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

async function main() {
  let calls = 0;
  const first = deferred();
  const load = () => { calls++; return first.promise; };
  const pending = refreshQuery('dependent:1:intake', load);
  assert.equal(pending, refreshQuery('dependent:1:intake', load));
  await Promise.resolve();
  assert.equal(calls, 1, 'Concurrent reads are deduplicated');
  first.resolve({ total: 10 });
  await pending;
  assert.equal(readQuery('dependent:1:intake').data.total, 10);
  assert.equal(readQuery('dependent:2:intake').hasData, false, 'Dependent keys are isolated');

  const next = deferred();
  const refreshing = refreshQuery('dependent:1:intake', () => next.promise);
  assert.equal(readQuery('dependent:1:intake').data.total, 10, 'Cached data stays visible during refresh');
  next.resolve({ total: 20 });
  await refreshing;
  await refreshQuery('dependent:1:intake', () => Promise.reject(new Error('offline')));
  assert.equal(readQuery('dependent:1:intake').data.total, 20, 'Network failure preserves previous data');
  assert.ok(readQuery('dependent:1:intake').error);

  const old = deferred();
  const stale = refreshQuery('dependent:1:intake', () => old.promise);
  let invalidated = false;
  const unsubscribe = subscribeQuery('dependent:1:intake', event => { if (event === 'invalidate') invalidated = true; });
  invalidateQueries();
  assert.ok(invalidated, 'Writes notify active subscribers');
  unsubscribe();
  await refreshQuery('dependent:1:intake', async () => ({ total: 30 }));
  old.resolve({ total: 1 });
  await stale;
  assert.equal(readQuery('dependent:1:intake').data.total, 30, 'Pre-mutation reads cannot overwrite newer data');

  const loggedOut = deferred();
  const oldSession = refreshQuery('dependent:1:intake', () => loggedOut.promise);
  clearQueryCache();
  await refreshQuery('dependent:1:intake', async () => ({ total: 99 }));
  loggedOut.resolve({ total: 40 });
  await oldSession;
  assert.equal(readQuery('dependent:1:intake').data.total, 99, 'Old session responses cannot repopulate the cache');
  await refreshQuery('dependent:1:intake', () => Promise.reject({ status: 404 }));
  assert.equal(readQuery('dependent:1:intake').hasData, false, 'Deleted records are discarded');
  clearQueryCache();
  assert.equal(readQuery('dependent:1:intake').hasData, false);
  console.log('Cache checks passed: deduplication, isolation, refresh, failure, invalidation, stale response and session cleanup.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
