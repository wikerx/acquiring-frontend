import test from 'node:test';
import assert from 'node:assert/strict';
import { createI18n } from 'vue-i18n';
import en from '../../../apps/hosted-checkout/src/i18n/en-US.ts';
import zh from '../../../apps/hosted-checkout/src/i18n/zh-CN.ts';
import {
  paymentLinkStatusDelay,
  usePaymentLinkError,
} from '../../../apps/hosted-checkout/src/utils/paymentLinkState.ts';
const active = {
  processing: false,
  status: 'ACTIVE',
  payable: true,
  serverTime: '2026-11-18T16:02:38',
  expireTime: '2026-12-18T16:02:38',
};
test('30-day links never overflow the browser timer into immediate repeated requests', () => {
  const delay = paymentLinkStatusDelay(active, 0);
  assert.ok(delay > 86400000);
  assert.ok(delay <= 2147483647, `unsafe browser timeout: ${delay}`);
});
test('normal expiry, expiry boundary, processing backoff and terminal states retain their timing', () => {
  assert.equal(
    paymentLinkStatusDelay({ ...active, expireTime: '2026-11-18T17:02:38' }, 0),
    3600200,
  );
  assert.equal(paymentLinkStatusDelay({ ...active, expireTime: active.serverTime }, 0), 500);
  assert.equal(paymentLinkStatusDelay({ ...active, processing: true }, 0), 5000);
  assert.equal(paymentLinkStatusDelay({ ...active, processing: true }, 9), 30000);
  assert.equal(paymentLinkStatusDelay({ ...active, status: 'COMPLETED', payable: false }, 0), null);
  assert.equal(paymentLinkStatusDelay({ ...active, expireTime: 'invalid' }, 0), null);
});
test('existing resolve and start errors immediately follow a language switch', () => {
  const i18n = createI18n({
    legacy: false,
    locale: 'en-US',
    messages: { 'en-US': en, 'zh-CN': zh },
  });
  const error = usePaymentLinkError((key) => i18n.global.t(key));
  for (const key of ['error', 'notFound', 'startError']) {
    i18n.global.locale.value = 'en-US';
    error.key.value = `paymentLinkEntry.${key}`;
    assert.equal(error.message.value, en.paymentLinkEntry[key]);
    i18n.global.locale.value = 'zh-CN';
    assert.equal(error.message.value, zh.paymentLinkEntry[key]);
  }
  error.key.value = '';
  assert.equal(error.message.value, '');
});
