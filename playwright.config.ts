import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    outputDir: './output/playwright-runs',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI
        ? [['line'], ['html', { outputFolder: './output/playwright-report', open: 'never' }]]
        : 'list',
    use: {
        baseURL: 'http://127.0.0.1:5174',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        { name: 'merchant-desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'merchant-mobile', use: { ...devices['Pixel 7'] } },
    ],
    webServer: {
        command: 'npm run dev:merchant',
        url: 'http://127.0.0.1:5174/login',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
