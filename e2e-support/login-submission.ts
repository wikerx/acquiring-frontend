import { expect, test, type Page } from '@playwright/test';

/** 使用虚构凭据和拦截接口验证登录交互，禁止向真实认证服务提交测试凭据。 */
export function loginSubmissionTests(app: 'admin' | 'merchant') {
    for (const input of ['password', 'captcha'] as const) {
        test(`one Enter in ${input} submits once without a duplicate warning`, async ({ page }) => {
            const state = await setupLogin(page, app);
            await fillCredentials(page, app);
            const form = credentialForm(page, app);
            await (input === 'password' ? form.locator('input[type="password"]') : captchaInput(page, app)).press('Enter');
            await expectCompleted(page, app, state);
            expect(state.loginRequests).toBe(1);
            expect(state.captchaRequests).toBe(1);
        });
    }

    test('clicking the login button submits once', async ({ page }) => {
        const state = await setupLogin(page, app);
        await fillCredentials(page, app);
        await credentialForm(page, app).locator('button[type="submit"], button.el-button--primary').click();
        await expectCompleted(page, app, state);
        expect(state.loginRequests).toBe(1);
        expect(state.captchaRequests).toBe(1);
        await page.screenshot({ path: test.info().outputPath('login-completed.png') });
    });

    test('rapid form submissions are ignored while validation or login is pending', async ({ page }) => {
        const state = await setupLogin(page, app);
        await fillCredentials(page, app);
        await submitRepeatedly(credentialForm(page, app));
        await expectCompleted(page, app, state);
        expect(state.loginRequests).toBe(1);
        expect(state.captchaRequests).toBe(1);
    });

    test('invalid credentials do not leave the form locked', async ({ page }) => {
        const state = await setupLogin(page, app);
        await fillCredentials(page, app);
        await credentialForm(page, app).locator('input[type="password"]').fill('');
        await credentialForm(page, app).evaluate((form: HTMLFormElement) => form.requestSubmit());
        await expect(page.locator(app === 'admin' ? '.el-form-item__error' : '.el-message--warning')).toBeVisible();
        expect(state.loginRequests).toBe(0);
        await fillCredentials(page, app);
        await captchaInput(page, app).press('Enter');
        await expectCompleted(page, app, state);
        expect(state.loginRequests).toBe(1);
    });

    test('failed authentication refreshes the captcha and allows retry', async ({ page }) => {
        const state = await setupLogin(page, app, { failFirst: true });
        await fillCredentials(page, app);
        await captchaInput(page, app).press('Enter');
        await expect(page.locator('.el-message--error')).toBeVisible();
        await expect.poll(() => state.captchaRequests).toBe(2);
        await expect(credentialForm(page, app).locator('button.el-button--primary')).not.toHaveClass(/is-loading/);
        await captchaInput(page, app).fill('1234');
        await captchaInput(page, app).press('Enter');
        await expectCompleted(page, app, state);
        expect(state.loginRequests).toBe(2);
        expect(state.captchaRequests).toBe(2);
    });

    test('rapid MFA submissions verify only once and finish login', async ({ page }) => {
        const state = await setupLogin(page, app, { mfa: true });
        await fillCredentials(page, app);
        await captchaInput(page, app).press('Enter');
        const form = page.locator(app === 'admin' ? 'form.mfa-form' : 'form.merchant-mfa-form');
        await expect(form).toBeVisible();
        const digits = form.locator('input');
        for (let i = 0; i < 6; i++) await digits.nth(i).fill(String(i + 1));
        await submitRepeatedly(form);
        await expectCompleted(page, app, state);
        expect(state.loginRequests).toBe(1);
        expect(state.mfaRequests).toBe(1);
        expect(state.captchaRequests).toBe(1);
    });
}

async function submitRepeatedly(form: ReturnType<typeof credentialForm>) {
    // 同一事件循环内重复提交，覆盖异步表单校验尚未结束的窗口。
    await form.evaluate((element: HTMLFormElement) => {
        element.requestSubmit();
        element.requestSubmit();
        element.requestSubmit();
    });
}

async function expectCompleted(page: Page, app: 'admin' | 'merchant', state: { pageErrors: string[] }) {
    await expect(page).not.toHaveURL(/\/login(?:[?#]|$)/);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    const notices = await page.evaluate(() => (window as Window & {
        loginTestNotices?: { duplicate: boolean; successes: number };
    }).loginTestNotices);
    expect(notices?.duplicate, 'no duplicate-submission warning at any time').toBe(false);
    if (app === 'admin') expect(notices?.successes, 'one success notification').toBe(1);
    expect(state.pageErrors, 'no unhandled browser errors').toEqual([]);
}

function credentialForm(page: Page, app: 'admin' | 'merchant') {
    return page.locator(app === 'admin' ? 'form.login-form:not(.mfa-form)' : 'form.merchant-login-form:not(.merchant-mfa-form)');
}

function captchaInput(page: Page, app: 'admin' | 'merchant') {
    return page.locator(app === 'admin' ? '.verify-code-row input' : '.merchant-login-verify-code input');
}

async function fillCredentials(page: Page, app: 'admin' | 'merchant') {
    const form = credentialForm(page, app);
    await expect(form.locator('img')).toBeVisible();
    if (app === 'merchant') await form.locator('input').first().fill('QA_MERCHANT');
    await form.locator('input[autocomplete="username"]').fill('qa-login-only');
    await form.locator('input[type="password"]').fill('qa-not-a-real-password');
    await captchaInput(page, app).fill('1234');
}

async function setupLogin(page: Page, app: 'admin' | 'merchant', options: { failFirst?: boolean; mfa?: boolean } = {}) {
    const state = { loginRequests: 0, mfaRequests: 0, captchaRequests: 0, authenticated: false, pageErrors: [] as string[] };
    page.on('pageerror', (error) => state.pageErrors.push(error.message));
    const session = {
        account: { accountId: 1, userId: 1, merchantUserId: 1, merchantId: 'QA_MERCHANT',
            appCode: app.toUpperCase(), loginAccount: 'qa-login-only', realName: 'QA', status: 1 },
        roles: [], permissions: [], menus: [], loginStatus: 'SUCCESS',
    };
    await page.addInitScript((target) => localStorage.setItem(`acquiring_${target}_locale`, 'zh-CN'), app);
    await page.addInitScript(() => {
        const notices = { duplicate: false, successes: 0 };
        (window as Window & { loginTestNotices?: typeof notices }).loginTestNotices = notices;
        const seen = new WeakSet<Element>();
        new MutationObserver(() => {
            for (const message of document.querySelectorAll('.el-message')) {
                if (seen.has(message)) continue;
                if (message.textContent?.includes('操作正在处理中，请勿重复提交。')) notices.duplicate = true;
                if (message.textContent?.includes('登录成功')) notices.successes++;
                seen.add(message);
            }
        }).observe(document, { childList: true, subtree: true });
    });
    await page.route(`**/${app}/**`, (route) => route.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'T200', data: null }),
    }));
    // 登录后工作台使用真实接口的空数据结构，避免无关接口空值污染登录异常断言。
    await page.route(/\/admin\/(?:merchants|system\/(?:users|login-logs|oper-logs))\/search(?:\?|$)/, (route) => route.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'T200', data: { records: [], total: 0, pageNo: 1, pageSize: 5 } }),
    }));
    await page.route('**/admin/system/notice/latest*', (route) => route.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'T200', data: [] }),
    }));
    await page.route(`**/${app}/auth/default-login-credential`, (route) => route.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'T200', data: {} }),
    }));
    await page.route(`**/${app}/auth/me`, (route) => route.fulfill({
        status: state.authenticated ? 200 : 401, contentType: 'application/json',
        body: JSON.stringify(state.authenticated ? { code: 'T200', data: session } : { code: 'F401', message: 'Unauthenticated' }),
    }));
    await page.route(`**/${app}/auth/verify-code/send`, (route) => {
        state.captchaRequests++;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'T200', data: {
            verifyCodeId: `qa-captcha-${state.captchaRequests}`,
            captchaImage: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><text x="10" y="25">QA 1234</text></svg>'),
        } }) });
    });
    await page.route(`**/${app}/auth/login`, async (route) => {
        state.loginRequests++;
        await new Promise((resolve) => setTimeout(resolve, 160));
        if (options.failFirst && state.loginRequests === 1) {
            await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 'F401', message: 'QA authentication rejected' }) });
            return;
        }
        if (options.mfa) {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'T200', data: {
                loginStatus: 'MFA_REQUIRED', mfaRequired: true, mfaChallengeType: 'VERIFY_REQUIRED', loginTicket: 'qa-login-ticket',
            } }) });
            return;
        }
        state.authenticated = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'T200', data: session }) });
    });
    await page.route(`**/${app}/auth/mfa/verify`, async (route) => {
        state.mfaRequests++;
        await new Promise((resolve) => setTimeout(resolve, 160));
        state.authenticated = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 'T200', data: session }) });
    });
    await page.goto('/login');
    return state;
}
