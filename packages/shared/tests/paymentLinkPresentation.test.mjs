import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isPaymentLinkAmountValid,
  paymentLinkDefaultCurrency,
  paymentLinkActorSource,
  paymentLinkOperatorName,
} from '../src/paymentLinkPresentation.ts';
import { createI18n } from 'vue-i18n';
import { paymentLinkMessagesZh, paymentLinkMessagesEn } from '../src/paymentLinkMessages.ts';
test('payment links use the system-order terminology shared by both portals', () => {
  assert.equal(paymentLinkMessagesZh.transaction, '系统订单号');
  assert.equal(paymentLinkMessagesEn.transaction, 'System Order No.');
  assert.equal(paymentLinkMessagesZh.noSystemOrder, '未生成系统订单');
});
test('new payment link amounts use the product range without rounding input', () => {
  for (const value of ['1', '1.00', '9.45', '999999.99'])
    assert.equal(isPaymentLinkAmountValid(value, 2), true, value);
  for (const value of [
    '',
    '0',
    '0.99',
    '1000000',
    '999999.999',
    '1.000',
    '1e2',
    '-1',
    '1,000',
    '01',
  ]) {
    assert.equal(isPaymentLinkAmountValid(value, 2), false, value);
  }
});
test('zero-minor-unit currencies require a positive integer and three-unit currencies still cap at two decimals', () => {
  assert.equal(isPaymentLinkAmountValid('999999', 0), true);
  for (const value of ['1.00', '9.45', '0', '1000000'])
    assert.equal(isPaymentLinkAmountValid(value, 0), false);
  assert.equal(isPaymentLinkAmountValid('1.2', 1), true);
  assert.equal(isPaymentLinkAmountValid('1.23', 1), false);
  assert.equal(isPaymentLinkAmountValid('1.23', 3), true);
  assert.equal(isPaymentLinkAmountValid('1.234', 3), false);
});
test('merchant settlement currency wins over alphabetical order; missing configuration stays unselected', () => {
  assert.equal(paymentLinkDefaultCurrency(['CNY', 'JPY', 'USD'], 'USD'), 'USD');
  assert.equal(paymentLinkDefaultCurrency(['CNY', 'JPY'], 'USD'), '');
  assert.equal(paymentLinkDefaultCurrency(['CNY', 'JPY']), '');
});

test('audit identities show account names and localized sources without naming anonymous payers', () => {
  const i18n = createI18n({
    legacy: false,
    locale: 'zh-CN',
    messages: {
      'zh-CN': { paymentLink: paymentLinkMessagesZh },
      'en-US': { paymentLink: paymentLinkMessagesEn },
    },
  });
  const t = (key, values = {}) => i18n.global.t(key, values);
  assert.equal(paymentLinkActorSource('MERCHANT', t), '商户端');
  assert.equal(paymentLinkActorSource('ADMIN', t), '管理端');
  assert.equal(paymentLinkOperatorName('MERCHANT', '6', '操作员 (admin)', t), '操作员 (admin)');
  assert.equal(
    paymentLinkOperatorName('PAYER', 'LINK_HOLDER', 'should not identify a payer', t),
    '链接持有人',
  );
  assert.equal(paymentLinkOperatorName('SYSTEM', undefined, undefined, t), '系统自动处理');
  assert.equal(paymentLinkOperatorName('MERCHANT', '6', undefined, t), '账号（ID：6）');
  assert.equal(paymentLinkOperatorName('OTHER', undefined, undefined, t), '—');
  i18n.global.locale.value = 'en-US';
  assert.equal(paymentLinkActorSource('MERCHANT', t), 'Merchant portal');
  assert.equal(paymentLinkOperatorName('PAYER', 'LINK_HOLDER', undefined, t), 'Link holder');
  assert.equal(paymentLinkOperatorName('MERCHANT', '6', undefined, t), 'Account (ID: 6)');
});
