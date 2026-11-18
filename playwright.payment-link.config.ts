import { defineConfig } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// 独立端口与固定响应，避免占用人工验收登录页或触发真实收款。
export default defineConfig({
  testDir: './e2e-payment-link',
  outputDir: join(tmpdir(), 'acquiring-payment-link-e2e'),
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  workers: 2,
  reporter: 'list',
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: [
    {
      command: 'npm --workspace @acquiring/admin-system run dev -- --port 5194 --strictPort',
      env: { VITE_ADMIN_DEV_LOGIN_ASSIST: 'false' },
      url: 'http://127.0.0.1:5194/login',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npm --workspace @acquiring/merchant-portal run dev -- --port 5195 --strictPort',
      url: 'http://127.0.0.1:5195/login',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npm --workspace @acquiring/hosted-checkout run dev -- --port 5196 --strictPort',
      url: 'http://127.0.0.1:5196',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
