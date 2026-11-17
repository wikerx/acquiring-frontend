import { defineConfig, devices } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export default defineConfig({
    testDir: './e2e-admin',
    testMatch: ['admin-channel-presentation.spec.ts', 'admin-transaction-clearing-detail.spec.ts'],
    outputDir: join(tmpdir(), 'acquiring-channel-presentation-e2e'),
    fullyParallel: true,
    workers: 4,
    forbidOnly: Boolean(process.env.CI),
    reporter: 'list',
    use: { baseURL: 'http://127.0.0.1:5186', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
    projects: [
        { name: 'admin-desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'admin-mobile', testMatch: '**/admin-channel-presentation.spec.ts', use: { ...devices['Pixel 7'] } },
    ],
    webServer: {
        command: 'npm --workspace @acquiring/admin-system run dev -- --port 5186 --strictPort',
        env: { VITE_ADMIN_DEV_LOGIN_ASSIST: 'false' },
        url: 'http://127.0.0.1:5186/login', reuseExistingServer: false, timeout: 120_000,
    },
});
