import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e-admin',
    outputDir: './output/playwright-admin-runs',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI
        ? [['line'], ['html', { outputFolder: './output/playwright-admin-report', open: 'never' }]]
        : 'list',
    use: {
        baseURL: 'http://127.0.0.1:5173',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        { name: 'admin-desktop', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
        command: 'npm run dev:admin',
        url: 'http://127.0.0.1:5173/login',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
