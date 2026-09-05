// Smoke checks for the Sovereign front. Serves public/ directly (no build needed).
//   npm run qa:smoke
//   PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chrome npm run qa:smoke
import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './tests/smoke',
  timeout: 45_000,
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E5_SMOKE_BASE_URL || 'http://127.0.0.1:4174',
    ...devices['Desktop Chrome'],
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: process.env.E5_SMOKE_BASE_URL ? undefined : {
    command: 'python3 -m http.server 4174 --directory public',
    url: 'http://127.0.0.1:4174/',
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 30_000,
  },
});
