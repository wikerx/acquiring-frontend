import assert from 'node:assert/strict';
import test from 'node:test';
import {
    formatExchangeRate,
    formatMoneyAmount,
    formatPercentageRate,
    formatPercentageValue,
    normalizeDecimalAmount,
    roundDecimalAmount,
} from '../src/amount.ts';

test('percentage display keeps at most two decimals without scientific notation', () => {
    assert.equal(formatPercentageRate('3.0000', 'en-US'), '3%');
    assert.equal(formatPercentageRate('3.126', 'en-US'), '3.13%');
    assert.equal(formatPercentageRate('1e-2', 'en-US'), '0.01%');
    assert.equal(formatPercentageValue('0E-8', 'en-US'), '0');
});

test('percentage display supports explicit precision for operational volatility', () => {
    assert.equal(formatPercentageRate('0.265790465', 'en-US', '-', 4), '0.2658%');
    assert.equal(formatPercentageValue('1e-3', 'en-US', '-', 4), '0.001');
});

test('exchange rate display keeps three to eight decimals without scientific notation', () => {
    assert.equal(formatExchangeRate('1', 'en-US'), '1.000');
    assert.equal(formatExchangeRate('1.1', 'en-US'), '1.100');
    assert.equal(formatExchangeRate('7.250000000000', 'en-US'), '7.250');
    assert.equal(formatExchangeRate('1.234567895', 'en-US'), '1.2345679');
    assert.equal(formatExchangeRate('1.234567894', 'en-US'), '1.23456789');
    assert.equal(formatExchangeRate('1.25e-2', 'en-US'), '0.0125');
    assert.equal(formatExchangeRate('0E-8', 'en-US'), '0.000');
});

test('money display removes insignificant trailing zeroes', () => {
    assert.equal(formatMoneyAmount('1.00', 'en-US'), '1');
    assert.equal(formatMoneyAmount('1.20', 'en-US'), '1.2');
});

test('money display rounds with HALF_UP semantics', () => {
    assert.equal(formatMoneyAmount('1.235', 'en-US'), '1.24');
    assert.equal(formatMoneyAmount('-0.005', 'en-US'), '-0.01');
    assert.equal(formatMoneyAmount('-0.004', 'en-US'), '0');
});

test('money display honors a zero-decimal currency exponent', () => {
    assert.equal(formatMoneyAmount('100.5', 'en-US', 0), '101');
});

test('money display expands scientific notation', () => {
    assert.equal(formatMoneyAmount('0E-8', 'en-US'), '0');
    assert.equal(formatMoneyAmount('1e3', 'en-US'), '1,000');
    assert.equal(formatMoneyAmount('-1.25e-2', 'en-US'), '-0.01');
});

test('money display preserves integers beyond JavaScript safe precision', () => {
    assert.equal(
        formatMoneyAmount('999999999999999999999.99', 'en-US'),
        '999,999,999,999,999,999,999.99',
    );
});

test('decimal helpers never retain negative zero', () => {
    assert.equal(roundDecimalAmount('-0.004', 2), '0.00');
    assert.equal(normalizeDecimalAmount('-0.000'), '0');
});

test('empty and invalid remote values degrade without fabrication', () => {
    assert.equal(formatMoneyAmount(null, 'en-US'), '-');
    assert.equal(formatMoneyAmount('', 'en-US'), '-');
    assert.equal(formatMoneyAmount('UNKNOWN', 'en-US'), 'UNKNOWN');
});
