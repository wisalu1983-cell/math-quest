import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './QA/e2e',
  timeout: 30_000,
  testMatch: '*.spec.ts',
  outputDir: 'QA/artifacts/playwright-test-results',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: true,
    viewport: { width: 390, height: 844 },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
  },
});
