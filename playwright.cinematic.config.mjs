import { defineConfig } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './tests/cinematic',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  outputDir: 'test-results/cinematic',
  use: {
    baseURL: process.env.E5_QA_BASE_URL || 'http://127.0.0.1:4173',
    headless: true,
    colorScheme: 'light',
    reducedMotion: 'no-preference',
    launchOptions: executablePath ? { executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader-webgl'] } : undefined,
  },
  webServer: {
    command: 'python3 -m http.server 4173 --directory dist',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 20_000,
  },
});
