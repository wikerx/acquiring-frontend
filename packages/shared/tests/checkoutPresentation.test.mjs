import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkoutCountryCode,
  checkoutPaymentLogoKeys,
  checkoutMerchantLogoKeys,
  checkoutReceiptIdentity,
  checkoutResultLogoKeys,
} from '../../../apps/hosted-checkout/src/utils/checkoutPresentation.ts';
const resolve = (method, brand) =>
  ({
    VISA: ['visa'],
    MASTERCARD: ['mastercard'],
    DINERS_CLUB: ['dinersClub'],
    PAYPAL: ['paypal'],
    APPLE_PAY: ['applePay'],
    GOOGLE_PAY: ['googlePay'],
    CASH_APP_PAY: ['cashAppPay'],
    UPI: ['upi'],
    PYUSD: ['pyusd'],
    BTC_ON_CHAIN: ['bitcoin'],
  })[brand || method] || [];
test('the carousel includes every allowed method and card brand, without duplicates or a fixed card list', () => {
  assert.deepEqual(
    checkoutPaymentLogoKeys(
      [
        { paymentMethod: 'BANK_CARD', brands: ['VISA', 'DINERS_CLUB', 'VISA'] },
        { paymentMethod: 'PAYPAL' },
        { paymentMethod: 'APPLE_PAY' },
        { paymentMethod: 'BTC_ON_CHAIN' },
      ],
      resolve,
    ),
    ['visa', 'dinersClub', 'paypal', 'applePay', 'bitcoin'],
  );
  assert.deepEqual(
    checkoutPaymentLogoKeys(
      [{ paymentMethod: 'BANK_CARD' }, { paymentMethod: 'UNKNOWN' }],
      resolve,
    ),
    [],
  );
});
test('receipts distinguish a persisted system order from an attempt without an order', () => {
  assert.deepEqual(checkoutReceiptIdentity('SYSTEM-ORDER', 'ATTEMPT'), {
    kind: 'systemOrder',
    value: 'SYSTEM-ORDER',
  });
  assert.deepEqual(checkoutReceiptIdentity(undefined, 'ATTEMPT'), {
    kind: 'attempt',
    value: 'ATTEMPT',
  });
  assert.deepEqual(checkoutReceiptIdentity(undefined, undefined), { kind: 'attempt', value: '—' });
});
test('merchant capabilities include wallets even when the session authorizes only cards, with old-server fallback', () => {
  const sessionMethods = [{ paymentMethod: 'BANK_CARD', brands: ['VISA'] }];
  assert.deepEqual(
    checkoutMerchantLogoKeys(
      {
        supportedPaymentMethods: [
          'BANK_CARD',
          'PAYPAL',
          'APPLE_PAY',
          'GOOGLE_PAY',
          'CASH_APP_PAY',
          'UPI',
          'BTC_ON_CHAIN',
          'PYUSD',
        ],
        supportedCardBrands: ['VISA', 'MASTERCARD'],
      },
      sessionMethods,
      resolve,
    ),
    [
      'visa',
      'mastercard',
      'paypal',
      'applePay',
      'googlePay',
      'cashAppPay',
      'upi',
      'bitcoin',
      'pyusd',
    ],
  );
  assert.deepEqual(sessionMethods, [{ paymentMethod: 'BANK_CARD', brands: ['VISA'] }]);
  assert.deepEqual(checkoutMerchantLogoKeys(undefined, sessionMethods, resolve), ['visa']);
  assert.deepEqual(
    checkoutMerchantLogoKeys({ supportedPaymentMethods: [] }, sessionMethods, resolve),
    ['visa'],
  );
});
test('results never guess Visa when the server omits the card brand', () => {
  assert.deepEqual(checkoutResultLogoKeys('BANK_CARD', undefined, resolve), []);
  assert.deepEqual(checkoutResultLogoKeys('BANK_CARD', 'MASTERCARD', resolve), ['mastercard']);
  assert.deepEqual(checkoutResultLogoKeys('PAYPAL', undefined, resolve), ['paypal']);
  assert.deepEqual(checkoutResultLogoKeys(undefined, undefined, resolve), []);
  assert.deepEqual(checkoutResultLogoKeys('BANK_CARD', undefined, resolve, ['bankCard']), [
    'bankCard',
  ]);
  assert.deepEqual(checkoutResultLogoKeys('BANK_CARD', 'UNKNOWN', resolve, ['bankCard']), [
    'bankCard',
  ]);
  assert.deepEqual(checkoutResultLogoKeys('BANK_CARD', 'MASTERCARD', resolve, ['bankCard']), [
    'mastercard',
  ]);
});

test('country defaults to USA independently of dictionary order and honors merchant alpha-2 or alpha-3 prefill', () => {
  const countries = [
    { countryCode: 'HK', countryCodeAlpha3: 'HKG' },
    { countryCode: 'US', countryCodeAlpha3: 'USA' },
    { countryCode: 'CA', countryCodeAlpha3: 'CAN' },
  ];
  assert.equal(checkoutCountryCode(countries), 'USA');
  assert.equal(checkoutCountryCode(countries, 'can'), 'CAN');
  assert.equal(checkoutCountryCode(countries, ' CA '), 'CAN');
  assert.equal(checkoutCountryCode(countries, 'HKG'), 'HKG');
  assert.equal(checkoutCountryCode(countries, 'invalid'), 'USA');
  assert.equal(checkoutCountryCode([], 'CAN'), '');
});
