import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../src/paymentLink.ts', import.meta.url), 'utf8');
const output = ts
  .transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  })
  .outputText.replace(
    /import \{ unwrapResult \} from ['"]\.\/index['"];?/,
    'const unwrapResult = r => { if(r.code !== "T200") throw new Error("Business failure"); return r.data; };',
  );
// Only the checked-in API source is evaluated; the already-tested envelope decoder is isolated from Vue assets.
// eslint-disable-next-line no-unsanitized/method
const { createPaymentLinkApi } = await import(
  `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`
);
function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
const result = (data) => ({ data: { code: 'T200', data } });
test('merges concurrent reads for the same actor and releases on completion', async () => {
  let calls = 0;
  const d = deferred();
  const api = createPaymentLinkApi(
    {
      post: () => {
        calls++;
        return d.promise;
      },
    },
    'admin',
    () => 'actor-1|zh',
  );
  const a = api.search({ pageNo: 1 });
  const b = api.search({ pageNo: 1 });
  assert.equal(calls, 1);
  d.resolve(result({ records: [], total: 0 }));
  assert.equal(await a, await b);
  await api.search({ pageNo: 1 });
  assert.equal(calls, 2);
});
test('read failure permits retry, and another actor or language cannot share in-flight reads', async () => {
  let calls = 0,
    context = 'actor-1|zh';
  const api = createPaymentLinkApi(
    {
      post: async () => {
        calls++;
        throw new Error('network');
      },
    },
    'merchant',
    () => context,
  );
  const a = api.search({});
  context = 'actor-2|zh';
  const b = api.search({});
  await Promise.allSettled([a, b]);
  assert.equal(calls, 2);
  await assert.rejects(api.search({}));
  assert.equal(calls, 3);
});
test('writes keep request IDs and never opt out of existing duplicate protection', async () => {
  const calls = [];
  const api = createPaymentLinkApi(
    {
      post: async (...args) => {
        calls.push(args);
        return result({ linkId: 'id' });
      },
    },
    'admin',
    () => 'actor',
  );
  const input = { requestId: 'stable', currency: 'USD', amount: '99.00' };
  await api.create(input, 'm1');
  await api.sendEmail('id', { requestId: 'mail-1', email: 'qa@example.invalid', locale: 'en-US' });
  await api.disable('id', { requestId: 'disable-1', version: 2, reason: 'test' });
  assert.deepEqual(calls[0], [
    '/admin/transactions/payment-links',
    input,
    { params: { merchantId: 'm1' } },
  ]);
  assert.ok(calls.every((call) => call[2].allowDuplicateSubmission !== true));
  assert.equal(calls[1][1].requestId, 'mail-1');
});
test('merchant create never sends a caller-selected merchant to the server', async () => {
  let options;
  const api = createPaymentLinkApi(
    {
      post: async (_url, _input, config) => {
        options = config;
        return result({});
      },
    },
    'merchant',
    () => 'm1',
  );
  await api.create({ requestId: 'id' }, 'm2');
  assert.equal(options.params, undefined);
});
test('business failures reject instead of showing success', async () => {
  const api = createPaymentLinkApi(
    { post: async () => ({ data: { code: 'T403', data: null } }) },
    'admin',
    () => 'actor',
  );
  await assert.rejects(api.share('link'));
});
