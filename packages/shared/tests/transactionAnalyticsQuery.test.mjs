import assert from 'node:assert/strict';
import test from 'node:test';
import { effectScope } from 'vue';
import { useTransactionAnalyticsQuery } from '../src/transactionAnalyticsQuery.ts';

function createQueries() {
    const scope = effectScope();
    const state = scope.run(useTransactionAnalyticsQuery);
    const applied = [];
    const requests = [];
    const load = (key) => state.run(key, () => new Promise((resolve, reject) => {
        requests.push({ succeed: (value) => resolve(() => applied.push(value)), reject });
    }));
    return { scope, state, load, applied, requests };
}

test('an older filter cannot overwrite a newer result in the same tab', async () => {
    const { scope, state, load, applied, requests } = createQueries();
    const previous = load('failures:USD');
    const current = load('failures:EUR');
    requests[1].succeed('EUR');
    await current;
    requests[0].succeed('USD');
    await previous;
    assert.deepEqual(applied, ['EUR']);
    assert.equal(state.loading.value, false);
    assert.equal(state.failed.value, false);
    scope.stop();
});

test('a rejected inactive tab cannot show an error or stop the current loading state', async () => {
    const { scope, state, load, applied, requests } = createQueries();
    const previous = load('overview:USD');
    const current = load('channels:USD');
    requests[0].reject(new Error('obsolete query'));
    await previous;
    assert.equal(state.loading.value, true);
    assert.equal(state.failed.value, false);
    requests[1].succeed('channels');
    await current;
    assert.deepEqual(applied, ['channels']);
    assert.equal(state.loading.value, false);
    scope.stop();
});

test('revisiting a tab with the same filters reuses its pending query and applies it once', async () => {
    const { scope, state, load, applied, requests } = createQueries();
    const first = load('overview:USD');
    const other = load('three-ds:EUR');
    const back = load('overview:USD');
    assert.equal(requests.length, 2);
    requests[1].succeed('three-ds');
    await other;
    assert.deepEqual(applied, []);
    assert.equal(state.loading.value, true);
    requests[0].succeed('overview');
    await Promise.all([first, back]);
    assert.deepEqual(applied, ['overview']);
    assert.equal(state.loading.value, false);
    scope.stop();
});

test('the latest failure can retry and leaving the page discards any pending response', async () => {
    const { scope, state, load, applied, requests } = createQueries();
    const failed = load('merchants:USD');
    requests[0].reject(new Error('current query'));
    await failed;
    assert.equal(state.failed.value, true);
    assert.equal(state.loading.value, false);
    const retry = load('merchants:USD');
    assert.equal(requests.length, 2);
    assert.equal(state.failed.value, false);
    scope.stop();
    requests[1].succeed('merchants');
    await retry;
    assert.deepEqual(applied, []);
    assert.equal(state.loading.value, false);
});
