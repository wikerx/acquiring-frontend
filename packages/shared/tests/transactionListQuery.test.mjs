import assert from 'node:assert/strict';
import test from 'node:test';
import { effectScope, nextTick, ref } from 'vue';
import { useTransactionListQuery } from '../src/transactionListQuery.ts';

function pendingRequests() {
    const calls = [];
    return {
        calls,
        fetch(query) {
            return new Promise((resolve, reject) => calls.push({ query, resolve, reject }));
        },
    };
}

function createQuery(summaryAfterPage = false) {
    const scope = effectScope();
    const page = ref(1);
    const pageSize = ref(10);
    const pages = pendingRequests();
    const summaries = pendingRequests();
    const errors = [];
    const state = scope.run(() => useTransactionListQuery({
        page,
        pageSize,
        fetchPage: pages.fetch,
        fetchSummary: summaries.fetch,
        summaryAfterPage,
        onPageError: (error) => errors.push(error),
    }));
    return { scope, page, pageSize, pages, summaries, errors, state };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test('page renders before summary and pagination uses the submitted filters', async () => {
    const { scope, page, pageSize, pages, summaries, state } = createQuery();
    const draft = { merchantId: 'merchant-a', queryTimeZone: 'Asia/Shanghai' };
    const result = state.search(draft);
    draft.merchantId = 'merchant-b';
    pages.calls[0].resolve({ records: ['first page'], total: 25 });
    await result;
    assert.deepEqual(state.rows.value, ['first page']);
    assert.equal(state.total.value, 25);
    assert.equal(state.loading.value, false);
    assert.equal(state.summaryLoading.value, true);

    page.value = 2;
    pageSize.value = 20;
    await nextTick();
    assert.equal(pages.calls.length, 2);
    assert.equal(summaries.calls.length, 1);
    assert.deepEqual(pages.calls[1].query, {
        merchantId: 'merchant-a', queryTimeZone: 'Asia/Shanghai', pageNo: 2, pageSize: 20,
    });
    summaries.calls[0].resolve({ totalCount: 24 });
    await settle();
    assert.equal(state.summary.value.totalCount, 24);
    assert.equal(state.total.value, 25);
    scope.stop();
});

test('stale responses are ignored and summary failures retry independently', async () => {
    const { scope, pages, summaries, errors, state } = createQuery();
    const formerSearch = state.search({ merchantId: 'former' });
    const currentSearch = state.search({ merchantId: 'current' });
    const duplicateSearch = state.search({ merchantId: 'current' });
    assert.equal(pages.calls.length, 2);
    assert.equal(summaries.calls.length, 2);
    pages.calls[1].resolve({ records: ['current page'], total: 1 });
    summaries.calls[1].reject(new Error('summary unavailable'));
    await Promise.all([currentSearch, duplicateSearch]);
    await settle();

    pages.calls[0].resolve({ records: ['former page'], total: 2 });
    summaries.calls[0].resolve({ totalCount: 2 });
    await formerSearch;
    await settle();
    assert.deepEqual(state.rows.value, ['current page']);
    assert.equal(state.summaryFailed.value, true);
    assert.equal(state.summary.value, undefined);
    assert.deepEqual(errors, []);

    const retry = state.loadSummary();
    assert.equal(pages.calls.length, 2);
    assert.equal(summaries.calls[2].query.merchantId, 'current');
    summaries.calls[2].resolve({ totalCount: 1 });
    await retry;
    assert.equal(state.summaryFailed.value, false);
    assert.equal(state.summary.value.totalCount, 1);
    scope.stop();
});

test('list-first queries defer aggregation and omit superseded filters', async () => {
    const { scope, pages, summaries, state } = createQuery(true);
    const formerSearch = state.search({ merchantId: 'former' });
    const currentSearch = state.search({ merchantId: 'current' });
    assert.equal(summaries.calls.length, 0);

    pages.calls[0].resolve({ records: [], total: 0 });
    await formerSearch;
    assert.equal(summaries.calls.length, 0);

    pages.calls[1].resolve({ records: ['current page'], total: 1 });
    await currentSearch;
    assert.deepEqual(state.rows.value, ['current page']);
    assert.equal(summaries.calls.length, 1);
    assert.equal(summaries.calls[0].query.merchantId, 'current');
    scope.stop();
});
