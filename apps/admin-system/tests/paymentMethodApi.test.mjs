import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadApi(app) {
  const calls = [];
  const response = { data: { code: 'T200', data: null } };
  const http = {
    post: async (url, body) => {
      calls.push({ method: 'POST', url, body });
      return response;
    },
    get: async (url, config) => {
      calls.push({ method: 'GET', url, params: config?.params });
      return response;
    },
  };
  const filename = path.resolve(import.meta.dirname, `../../${app}/src/api/paymentMethodApi.ts`);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    fileName: filename,
  }).outputText;
  const exports = {};
  vm.runInNewContext(
    source,
    {
      exports,
      require: (name) => {
        if (name === '@/api/http') return { http };
        if (name === '@acquiring/shared') return { unwrapResult: (value) => value.data };
        throw new Error(`Unexpected import: ${name}`);
      },
    },
    { filename },
  );
  return { api: exports.paymentMethodApi, calls };
}
const copy = (value) => JSON.parse(JSON.stringify(value));

test('merchant queries cannot use a supplied merchant scope', async () => {
  const { api, calls } = loadApi('merchant-portal');
  await api.methods('another-merchant', {
    merchantId: 'another-merchant',
    pageNo: 2,
    pageSize: 10,
  });
  await api.applications({
    merchantId: 'another-merchant',
    pageNo: 1,
    pageSize: 20,
    status: 'RETURNED',
  });
  assert.equal(calls[0].url, '/merchant/payment-methods/search');
  assert.deepEqual(copy(calls[0].body), { pageNo: 2, pageSize: 10 });
  assert.equal(calls[1].url, '/merchant/payment-method-applications/search');
  assert.equal('merchantId' in calls[1].body, false);
});

test('merchant creates canonical item keys without caller identity fields', async () => {
  const { api, calls } = loadApi('merchant-portal');
  const input = {
    requestId: 'stable-command',
    items: ['CARD_BRAND:VISA', 'METHOD:APPLE_PAY'],
    reason: 'request',
  };
  await api.apply('ignored', input);
  await api.apply('different-ignored-scope', input);
  assert.equal(calls[0].url, '/merchant/payment-method-applications');
  assert.deepEqual(copy(calls[0].body), input);
  assert.deepEqual(copy(calls[1].body), input);
});

test('admin exact merchant scope is encoded in resource path and queue filter', async () => {
  const { api, calls } = loadApi('admin-system');
  await api.methods('M/42', { pageNo: 1, pageSize: 20 });
  await api.applications({ merchantId: 'M/42', status: 'PENDING_REVIEW', pageNo: 3, pageSize: 10 });
  assert.equal(calls[0].url, '/admin/merchants/M%2F42/payment-methods/search');
  assert.deepEqual(copy(calls[1].body), {
    pageNo: 3,
    pageSize: 10,
    status: 'PENDING_REVIEW',
    merchantId: 'M/42',
  });
});

test('admin decisions preserve command identity and version without reviewer identity', async () => {
  const { api, calls } = loadApi('admin-system');
  const body = {
    requestId: 'same-command',
    expectedVersion: '9',
    decision: 'RETURN',
    reason: 'supplement',
  };
  await api.decide('item/7', body);
  assert.equal(calls[0].url, '/admin/merchant-payment-application-items/item%2F7/decisions');
  assert.deepEqual(copy(calls[0].body), body);
  assert.equal('reviewerId' in calls[0].body, false);
});

test('single-operator lifecycle commands target authorization and retain time boundaries', async () => {
  const { api, calls } = loadApi('admin-system');
  const body = {
    requestId: 'validity-command',
    expectedVersion: '4',
    reason: 'extend',
    effectiveTime: '2026-11-20 08:00:00',
    expireTime: null,
  };
  await api.lifecycle('200045', 'METHOD:APPLE_PAY', 'validity', body);
  assert.equal(calls[0].url, '/admin/merchants/200045/payment-methods/METHOD%3AAPPLE_PAY/validity');
  assert.deepEqual(copy(calls[0].body), body);
});

test('merchant supplement and withdraw use item identity and expected version', async () => {
  const { api, calls } = loadApi('merchant-portal');
  const body = { requestId: 'item-command', expectedVersion: '3', reason: 'additional detail' };
  await api.resubmit('id/1', body);
  await api.withdraw('id/2', body);
  assert.equal(calls[0].url, '/merchant/payment-method-application-items/id%2F1/resubmit');
  assert.equal(calls[1].url, '/merchant/payment-method-application-items/id%2F2/withdraw');
  assert.deepEqual(copy(calls[0].body), body);
});

test('scope-specific unsupported operations stop before network access', () => {
  const merchant = loadApi('merchant-portal');
  const admin = loadApi('admin-system');
  const body = { requestId: 'command', expectedVersion: '1' };
  assert.throws(() => merchant.api.decide('x', { ...body, decision: 'APPROVE' }), /Admin-only/);
  assert.throws(
    () => merchant.api.lifecycle('x', 'CARD_BRAND:VISA', 'restore', body),
    /Admin-only/,
  );
  assert.throws(() => merchant.api.history('x', 'CARD_BRAND:VISA', 1, 20), /Admin-only/);
  assert.throws(() => admin.api.resubmit('x', body), /Merchant-only/);
  assert.throws(() => admin.api.withdraw('x', body), /Merchant-only/);
  assert.equal(merchant.calls.length + admin.calls.length, 0);
});

test('historical registration submits explicit references and evidence times unchanged', async () => {
  const { api, calls } = loadApi('admin-system');
  const body = {
    requestId: 'evidence-command',
    cutoffTime: '2026-11-20T12:00:00',
    reason: 'Verified archive references',
    items: [
      {
        itemKey: 'CARD_BRAND:VISA',
        evidenceType: 'SUCCESSFUL_PAYMENT',
        evidenceRef: 'ORDER-REFERENCE-1',
        evidenceTime: '2026-11-19T10:00:00',
      },
    ],
  };
  await api.submitBaseline('200045', body);
  assert.equal(calls[0].url, '/admin/merchants/200045/payment-method-history-baselines');
  assert.deepEqual(copy(calls[0].body), body);
});

test('historical batch lookup and partial review retain the selected allowlist only', async () => {
  const { api, calls } = loadApi('admin-system');
  await api.baseline('200045', 'batch/1');
  const body = {
    requestId: 'review-command',
    approvedItemKeys: ['METHOD:APPLE_PAY'],
    reason: 'Evidence reviewed',
  };
  await api.approveBaseline('200045', 'batch/1', body);
  assert.equal(calls[0].url, '/admin/merchants/200045/payment-method-history-baselines/batch%2F1');
  assert.equal(
    calls[1].url,
    '/admin/merchants/200045/payment-method-history-baselines/batch%2F1/approve',
  );
  assert.deepEqual(copy(calls[1].body), body);
  assert.equal('reviewerId' in calls[1].body, false);
});

test('batch review preserves each original command key and version in one explicit envelope', async () => {
  const { api, calls } = loadApi('admin-system');
  const items = [
    {
      itemId: 'i1',
      command: { requestId: 'original-1', expectedVersion: '3', decision: 'APPROVE' },
    },
    {
      itemId: 'i2',
      command: {
        requestId: 'original-2',
        expectedVersion: '5',
        decision: 'RETURN',
        reason: 'Evidence',
      },
    },
  ];
  await api.decideBatch(items);
  await api.decideBatch(items);
  assert.equal(calls[0].url, '/admin/merchant-payment-application-items/decisions/batch');
  assert.deepEqual(copy(calls[0].body), { items });
  assert.deepEqual(copy(calls[1].body), { items });
});
