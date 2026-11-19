import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { listCheckoutCountries } from '../src/api/checkoutConfig.ts';

test('country list preserves the full platform dictionary instead of a fixed country subset', async (t) => {
  const countries = [
    { countryCode: 'US', countryCodeAlpha3: 'USA', countryName: 'United States' },
    { countryCode: 'CA', countryCodeAlpha3: 'CAN', countryName: 'Canada' },
    { countryCode: 'HK', countryCodeAlpha3: 'HKG', countryName: 'Hong Kong' },
    { countryCode: 'SG', countryCodeAlpha3: 'SGP', countryName: 'Singapore' },
  ];
  t.mock.method(axios, 'get', async (url) => {
    assert.equal(url, '/checkout/config/countries');
    return { data: { code: 'SUCCESS', data: countries } };
  });
  assert.deepEqual(await listCheckoutCountries(), countries);
});
test('a dictionary without payment country codes is rejected instead of sending invalid alpha-2 codes', async (t) => {
  t.mock.method(axios, 'get', async () => ({
    data: { code: 'SUCCESS', data: [{ countryCode: 'US' }] },
  }));
  await assert.rejects(listCheckoutCountries());
});
test('country endpoint failures remain failures and never fall back to a fabricated two-country list', async (t) => {
  t.mock.method(axios, 'get', async () => {
    throw new Error('unavailable');
  });
  await assert.rejects(listCheckoutCountries());
});
