import { expect, test, type Page, type Route } from '@playwright/test';
import { constants, createDecipheriv, generateKeyPairSync, privateDecrypt } from 'node:crypto';

const origin = process.env.REQ001_CHECKOUT_DEV_ORIGIN ?? 'http://127.0.0.1:5196';
const authorizationUrl = 'http://127.0.0.1:58090/simulate/hosted-payins/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const remoteAuthorizationUrl = 'https://wallet-simulator.example.test:8443/channel/simulate/hosted-payins/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function walletSession(pageState = 'PAYABLE', includeCard = true) {
  return {
    checkoutSessionId: 'synthetic-wallet-session',
    pageState,
    merchant: { displayName: '200046' },
    order: { orderNo: 'QA-WALLET', amount: '7.00', currency: 'USD', currencyExponent: 2 },
    paymentOptions: [
      ...(includeCard ? [{ paymentMethod: 'BANK_CARD', brands: ['VISA'], serverSubmitAllowed: true, executionStatus: 'READY' }] : []),
      ...['APPLE_PAY', 'GOOGLE_PAY'].map((paymentMethod) => ({
        paymentMethod,
        brands: [],
        serverSubmitAllowed: false,
        executionStatus: 'REDIRECT_AVAILABLE',
      })),
    ],
    ...(includeCard ? { cardEncryption: {} } : {}),
    checkout: {
      serverTime: new Date().toISOString(),
      expireTime: new Date(Date.now() + 3_600_000).toISOString(),
      retryAllowed: true,
    },
  };
}

async function openCheckout(
  page: Page,
  authorize: (route: Route) => Promise<void>,
  merchant = '200046',
  queryData?: () => ReturnType<typeof walletSession>,
) {
  await page.addInitScript(() => localStorage.setItem('acquiring_checkout_locale', 'en-US'));
  await page.route('**/*', (route) => (
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort()
  ));
  await page.route('**/checkout/config/countries', (route) => route.fulfill({ json: {
    code: 'SUCCESS',
    data: [{ countryCode: 'US', countryCodeAlpha3: 'USA', countryName: 'United States' }],
  } }));
  await page.route('**/checkout/api/**', (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname.endsWith('/wallet/authorization')) return authorize(route);
    expect(pathname).toMatch(/\/session\/query$/);
    const data = queryData?.() ?? walletSession();
    data.merchant.displayName = merchant;
    return route.fulfill({ json: { code: 'A0000', data } });
  });
  await page.goto(`${origin}/checkout/${'qa'.repeat(16)}/wallet-preview`);
  await expect(page.getByRole('button', { name: 'Card', exact: true })).toHaveAttribute('aria-pressed', 'true');
}

function reply(route: Route, state: string, redirectUrl = authorizationUrl) {
  return route.fulfill({ json: { code: 'A0000', data: state === 'READY' ? { state, redirectUrl } : { state } } });
}

for (const [wallet, code, width, channelUrl] of [
  ['Apple Pay', 'APPLE_PAY', 1440, authorizationUrl],
  ['Google Pay', 'GOOGLE_PAY', 390, authorizationUrl],
  ['Apple Pay', 'APPLE_PAY', 1440, remoteAuthorizationUrl],
  ['Google Pay', 'GOOGLE_PAY', 390, remoteAuthorizationUrl],
] as const) {
  const channelLocation = channelUrl === authorizationUrl ? 'local' : 'remote';
  test(`${wallet} opens the ${channelLocation} channel from one centered branded-button click at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const actions: string[] = [];
    let approvalRequested = false;
    page.on('request', request => {
      if (request.url() === channelUrl) approvalRequested = true;
    });
    await openCheckout(page, async (route) => {
      const body = route.request().postDataJSON();
      expect(body.paymentMethod).toBe(code);
      actions.push(body.action);
      await reply(route, 'READY', channelUrl);
    });

    const walletRow = page.locator('.checkout-payment-item').filter({
      has: page.getByRole('button', { name: wallet, exact: true }),
    });
    const walletButton = walletRow.getByRole('button', { name: `Pay with ${wallet}`, exact: true });

    await walletRow.getByRole('button', { name: wallet, exact: true }).click();
    await expect(walletButton).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(0);
    await expect(page.getByText('Simulation', { exact: true })).toHaveCount(0);
    await expect(page.getByText('模拟', { exact: true })).toHaveCount(0);

    const rowBox = (await walletRow.boundingBox())!;
    const buttonBox = (await walletButton.boundingBox())!;
    expect(Math.abs(rowBox.x + rowBox.width / 2 - buttonBox.x - buttonBox.width / 2)).toBeLessThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await walletButton.click();
    await expect.poll(() => actions).toEqual(['PREPARE', 'OPEN']);
    await expect.poll(() => approvalRequested).toBe(true);
  });
}

test('failed preparation keeps the branded wallet button available and rejects an untrusted authorization URL', async ({ page }) => {
  let call = 0;
  await openCheckout(page, async (route) => {
    call += 1;
    if (call === 1) return route.fulfill({ status: 503, json: { code: 'NETWORK_BUSY' } });
    return reply(route, 'READY', 'https://example.invalid/authorize');
  });
  await page.getByRole('button', { name: 'Apple Pay', exact: true }).click();
  const walletButton = page.getByRole('button', { name: 'Pay with Apple Pay', exact: true });
  await walletButton.click();
  await expect(page.getByText('Wallet payment could not be opened. Select the wallet button to try again.')).toBeVisible();
  await walletButton.click();
  await expect(page.getByText('Wallet payment could not be opened. Select the wallet button to try again.')).toBeVisible();
  await expect(walletButton).toBeEnabled();
});

test('a failed wallet-only checkout can return to payment selection without card encryption', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('acquiring_checkout_locale', 'en-US'));
  await page.route('**/checkout/config/countries', (route) => route.fulfill({ json: {
    code: 'SUCCESS',
    data: [{ countryCode: 'US', countryCodeAlpha3: 'USA', countryName: 'United States' }],
  } }));
  let queryCount = 0;
  await page.route('**/checkout/api/**', (route) => {
    const { pathname } = new URL(route.request().url());
    expect(pathname).toMatch(/\/session\/query$/);
    queryCount += 1;
    const data = walletSession(queryCount === 1 ? 'FAILED_RETRYABLE' : 'PAYABLE', false);
    if (queryCount === 1) {
      Object.assign(data, {
        paymentResult: {
          checkoutSessionId: data.checkoutSessionId,
          pageState: 'FAILED_RETRYABLE',
          failure: { reasonCode: 'CHANNEL_DECLINED', retryAllowed: true },
          actions: {
            method: 'POST',
            redirectUrl: 'https://merchant.example/return',
            delaySeconds: 0,
            formFields: { merchantId: '200047', transactionStatus: 'FAILED' },
          },
        },
      });
    }
    return route.fulfill({ json: { code: 'A0000', data } });
  });

  await page.goto(`${origin}/checkout/${'qa'.repeat(16)}/wallet-retry`);
  await expect(page.getByRole('heading', { name: 'Payment Failed', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Return to merchant', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Try Again', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Apple Pay', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Apple Pay', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pay with Apple Pay', exact: true })).toBeVisible();
  expect(queryCount).toBe(2);
});

test('status and blocked pages keep the standard checkout shell dimensions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  let pageState = 'PAYABLE';
  await openCheckout(page, async (route) => reply(route, 'READY'), '200046', () => {
    const data = walletSession(pageState);
    if (pageState === 'FAILED_RETRYABLE') {
      Object.assign(data, {
        paymentResult: {
          checkoutSessionId: data.checkoutSessionId,
          pageState: 'FAILED_RETRYABLE',
          failure: { reasonCode: 'CHANNEL_DECLINED', retryAllowed: true },
        },
      });
    }
    return data;
  });

  const standard = {
    topbar: (await page.locator('.checkout-topbar').boundingBox())!,
    footer: (await page.locator('.checkout-trust-footer').boundingBox())!,
    sidebar: (await page.locator('.checkout-receipt').boundingBox())!,
    main: (await page.locator('.checkout-form-panel').boundingBox())!,
  };

  pageState = 'FAILED_RETRYABLE';
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Payment Failed', exact: true })).toBeVisible();
  const failed = {
    topbar: (await page.locator('.checkout-topbar').boundingBox())!,
    footer: (await page.locator('.checkout-trust-footer').boundingBox())!,
    main: (await page.locator('.checkout-status-shell').boundingBox())!,
  };
  expect(Math.abs(failed.topbar.width - standard.topbar.width)).toBeLessThan(1);
  expect(Math.abs(failed.footer.width - standard.footer.width)).toBeLessThan(1);
  expect(Math.abs(failed.main.width - standard.main.width)).toBeLessThan(1);

  await page.goto(`${origin}/checkout/invalid/invalid`);
  await expect(page.locator('.checkout-status-shell--blocked')).toBeVisible();
  const blocked = {
    topbar: (await page.locator('.checkout-topbar').boundingBox())!,
    footer: (await page.locator('.checkout-trust-footer').boundingBox())!,
    main: (await page.locator('.checkout-status-shell').boundingBox())!,
  };
  expect(Math.abs(blocked.topbar.width - standard.topbar.width)).toBeLessThan(1);
  expect(Math.abs(blocked.footer.width - standard.footer.width)).toBeLessThan(1);
  await expect(page.locator('.checkout-trustbar')).toHaveCount(0);
  expect(Math.abs(blocked.main.width - standard.main.width)).toBeLessThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('another configured merchant receives the same wallet authorization capability', async ({ page }) => {
  await openCheckout(page, async (route) => reply(route, 'READY'), '200047');
  await expect(page.getByRole('button', { name: 'Pay USD 7', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Apple Pay', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pay with Apple Pay', exact: true })).toBeVisible();
});

test('development LAN access keeps encrypted card payment available', async ({ page }) => {
  await openCheckout(page, async (route) => reply(route, 'READY'));
  await expect(page.getByText(
    'This browser cannot securely handle card details. Try another browser or payment method.',
    { exact: true },
  )).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Pay USD 7', exact: true })).toBeEnabled();

  const keyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const metadata = {
    algorithm: 'RSA-OAEP-256+A256GCM',
    keyId: 'checkout-card-lan-test-v1',
    publicKey: keyPair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
    nonce: 'bm9uY2UtbGFuLXRlc3QtMDAwMQ',
  };
  const checkoutSessionId = 'CS-LAN-ENCRYPTION-TEST';
  const attemptRequestId = 'ATT-LAN-ENCRYPTION-TEST';
  const cardData = {
    cardNo: '4111111111111111',
    expirationMonth: '12',
    expirationYear: '2099',
    securityCode: '123',
    cardholderName: 'LAN TEST BUYER',
  };
  const encrypted = await page.evaluate(async (input) => {
    const { encryptCheckoutCardData } = await import(/* @vite-ignore */ '/src/utils/cardEncryption.ts');
    return encryptCheckoutCardData(
      input.metadata,
      input.checkoutSessionId,
      input.attemptRequestId,
      input.cardData,
    );
  }, { metadata, checkoutSessionId, attemptRequestId, cardData });

  expect(JSON.stringify(encrypted)).not.toContain(cardData.cardNo);
  expect(encrypted).toMatchObject({
    algorithm: metadata.algorithm,
    keyId: metadata.keyId,
    nonce: metadata.nonce,
  });
  const contentKey = privateDecrypt({
    key: keyPair.privateKey,
    oaepHash: 'sha256',
    padding: constants.RSA_PKCS1_OAEP_PADDING,
  }, Buffer.from(encrypted.encryptedKey, 'base64url'));
  const ciphertextAndTag = Buffer.from(encrypted.ciphertext, 'base64url');
  const authenticationTag = ciphertextAndTag.subarray(ciphertextAndTag.length - 16);
  const ciphertext = ciphertextAndTag.subarray(0, ciphertextAndTag.length - 16);
  const decipher = createDecipheriv(
    'aes-256-gcm',
    contentKey,
    Buffer.from(encrypted.iv, 'base64url'),
  );
  decipher.setAAD(Buffer.from(
    `checkout-card-v1|${checkoutSessionId}|${attemptRequestId}|${metadata.nonce}`,
    'utf8',
  ));
  decipher.setAuthTag(authenticationTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  expect(JSON.parse(plaintext)).toEqual(cardData);
});

test('development LAN success may post to a private merchant return URL but not a public HTTP URL', async ({ page }) => {
  await openCheckout(page, async (route) => reply(route, 'READY'));
  const result = await page.evaluate(async () => {
    const { resolveMerchantPostUrl } = await import(/* @vite-ignore */ '/src/utils/urlSecurity.ts');
    return {
      privateUrl: resolveMerchantPostUrl('http://192.168.0.120:58091/payment/result'),
      publicUrl: resolveMerchantPostUrl('http://8.8.8.8/payment/result'),
    };
  });
  expect(result.privateUrl).toBe('http://192.168.0.120:58091/payment/result');
  expect(result.publicUrl).toBeNull();
});

test('an unconfigured merchant keeps its original card-only checkout', async ({ page }) => {
  await openCheckout(page, async () => { throw new Error('Unexpected wallet authorization'); }, '200045', () => {
    const data = walletSession();
    data.paymentOptions = data.paymentOptions.filter((method) => method.paymentMethod === 'BANK_CARD');
    return data;
  });
  await expect(page.getByRole('button', { name: 'Card', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Apple Pay', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Google Pay', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Pay USD 7', exact: true })).toBeEnabled();
});
