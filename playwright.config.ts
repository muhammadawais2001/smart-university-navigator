import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:5173' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'android', use: { ...devices['Pixel 7'] } },
    { name: 'tablet', use: { ...devices['iPad (gen 7)'] } },
  ],
  webServer: [
    { command: 'npm run dev -w backend', port: 4000, reuseExistingServer: true },
    { command: 'npm run dev -w frontend', port: 5173, reuseExistingServer: true },
  ],
});
