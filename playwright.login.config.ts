import { defineConfig, devices } from '@playwright/test';

/** 独立端口与虚构凭据，避免登录回归依赖开发环境默认账号和现有登录态。 */
export default defineConfig({
    testDir: '.',
    outputDir: '/tmp/acquiring-login-submission-results',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: 0,
    workers: 2,
    reporter: 'list',
    use: { trace: 'off', screenshot: 'only-on-failure', video: 'off' },
    projects: [
        { name: 'admin-desktop', testMatch: 'e2e-admin/admin-login-submission.spec.ts', use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5183' } },
        { name: 'admin-mobile', testMatch: 'e2e-admin/admin-login-submission.spec.ts', use: { ...devices['Pixel 7'], baseURL: 'http://127.0.0.1:5183' } },
        { name: 'merchant-desktop', testMatch: 'e2e/merchant-login-submission.spec.ts', use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5184' } },
        { name: 'merchant-mobile', testMatch: 'e2e/merchant-login-submission.spec.ts', use: { ...devices['Pixel 7'], baseURL: 'http://127.0.0.1:5184' } },
    ],
    webServer: [
        {
            command: 'npm --workspace @acquiring/admin-system run dev -- --port 5183 --strictPort',
            url: 'http://127.0.0.1:5183/login',
            env: { VITE_ADMIN_DEV_LOGIN_ASSIST: 'false' },
            reuseExistingServer: false,
            timeout: 120_000,
        },
        {
            command: 'npm --workspace @acquiring/merchant-portal run dev -- --port 5184 --strictPort',
            url: 'http://127.0.0.1:5184/login',
            reuseExistingServer: false,
            timeout: 120_000,
        },
    ],
});
