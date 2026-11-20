import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const source = fs.readFileSync(
  new URL('../src/views/merchant/payment-methods/batchReviewState.ts', import.meta.url),
  'utf8',
);
const output = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
// The module URL is constructed only from the checked-in pure presentation source above.
// eslint-disable-next-line no-unsanitized/method
const state = await import(moduleUrl);
const { preparePaymentReviewBatch, paymentReviewResults } = state;
const items = [
  { id: 'i1', itemKey: 'CARD_BRAND:VISA', status: 'PENDING_REVIEW', version: '7' },
  { id: 'i2', itemKey: 'METHOD:APPLE_PAY', status: 'PENDING_REVIEW', version: '4' },
  { id: 'i3', itemKey: 'CARD_BRAND:JCB', status: 'APPROVED', version: '9' },
];
test('batch preparation freezes pending item versions and independent command keys', () => {
  let sequence = 0;
  const commands = preparePaymentReviewBatch(
    items,
    'RETURN',
    ' evidence needed ',
    () => `command-${++sequence}`,
  );
  assert.deepEqual(commands, [
    {
      itemId: 'i1',
      command: {
        requestId: 'command-1',
        expectedVersion: '7',
        decision: 'RETURN',
        reason: 'evidence needed',
      },
    },
    {
      itemId: 'i2',
      command: {
        requestId: 'command-2',
        expectedVersion: '4',
        decision: 'RETURN',
        reason: 'evidence needed',
      },
    },
  ]);
  assert.equal(items[0].version, '7');
});
test('partial results keep explicit unknown and unprocessed states distinct', () => {
  const commands = [{ itemId: 'i1' }, { itemId: 'i2' }, { itemId: 'i3' }, { itemId: 'i4' }];
  const results = paymentReviewResults(commands, [
    { itemId: 'i1', outcome: 'SUCCEEDED', receipt: { version: '8' } },
    { itemId: 'i2', outcome: 'FAILED', code: 'T403' },
    { itemId: 'i3', outcome: 'UNKNOWN' },
    { itemId: 'i4', outcome: 'NOT_PROCESSED' },
  ]);
  assert.deepEqual(
    results.map((item) => item.outcome),
    ['SUCCEEDED', 'FAILED', 'UNKNOWN', 'NOT_PROCESSED'],
  );
});
test('an omitted receipt is unknown even when another item succeeded', () => {
  assert.deepEqual(
    paymentReviewResults(
      [{ itemId: 'i1' }, { itemId: 'i2' }],
      [{ itemId: 'i1', outcome: 'SUCCEEDED' }],
    ),
    [
      { itemId: 'i1', outcome: 'SUCCEEDED' },
      { itemId: 'i2', outcome: 'UNKNOWN' },
    ],
  );
});
test('recovery resolves results against the original commands without new keys or versions', () => {
  const commands = preparePaymentReviewBatch(items, 'APPROVE', '', () => 'stable-original');
  const original = structuredClone(commands);
  paymentReviewResults(commands, [
    { itemId: 'i1', outcome: 'SUCCEEDED' },
    { itemId: 'i2', outcome: 'UNKNOWN' },
  ]);
  const recovered = paymentReviewResults(commands, [
    { itemId: 'i1', outcome: 'SUCCEEDED' },
    { itemId: 'i2', outcome: 'SUCCEEDED' },
  ]);
  assert.deepEqual(commands, original);
  assert.equal(
    recovered.every((item) => item.outcome === 'SUCCEEDED'),
    true,
  );
});
