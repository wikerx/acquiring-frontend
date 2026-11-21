import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/transactionCardDisplay.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
runInNewContext(compiled, { exports });
const { formatTransactionCardDisplay } = exports;

test('both six- and eight-digit masked prefixes use six digits and the real last four', () => {
    assert.equal(formatTransactionCardDisplay('393236****7722', '39323612'), '393236****7722');
    assert.equal(formatTransactionCardDisplay('39323612****7722', '39323612'), '393236****7722');
});
test('formatted masked values preserve only the approved visible digits', () => {
    assert.equal(formatTransactionCardDisplay('3932 3612 •••• 7722'), '393236****7722');
});
test('BIN-only fallback never invents a card suffix', () => {
    assert.equal(formatTransactionCardDisplay(null, '39323612'), '393236****');
    assert.equal(formatTransactionCardDisplay(null, '393236'), '393236****');
});
test('a known suffix may be combined with a known BIN prefix', () => {
    assert.equal(formatTransactionCardDisplay('****7722', '39323612'), '393236****7722');
    assert.equal(formatTransactionCardDisplay('****7722'), '****7722');
});
test('unexpected unmasked input is still redacted', () => {
    assert.equal(formatTransactionCardDisplay('9'.repeat(16)), '999999****9999');
});
test('missing or malformed data does not render an untrusted original value', () => {
    assert.equal(formatTransactionCardDisplay(), '-');
    assert.equal(formatTransactionCardDisplay('invalid', '123'), '-');
});
