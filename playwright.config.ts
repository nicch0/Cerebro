import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: false, // Run tests sequentially for Obsidian interactions
  forbidOnly: !!process.env.CI, // Fail if tests are focused in CI
  retries: process.env.CI ? 2 : 0, // Retry failed tests in CI
  workers: 1, // Run tests one at a time since we're dealing with a single Obsidian instance
  reporter: [
    ['html'],
    ['list']
  ],
  
  // Global setup and teardown
  globalSetup: './tests/e2e/helpers/global-setup.ts',
  globalTeardown: './tests/e2e/helpers/global-teardown.ts',
  
  use: {
    // Base URL for Obsidian (only used as placeholder for Playwright)
    baseURL: 'app://obsidian.md',
    
    // Capture trace on failure for debugging
    trace: 'on-first-retry',
    
    // Record video for failed tests
    video: 'on-first-retry',
    
    // Slow down operations for better visibility during testing (remove for CI)
    launchOptions: {
      slowMo: process.env.CI ? 0 : 100,
    }
  },
  
  // Configure projects for different browsers/environments
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    /* Uncomment to add Firefox or webkit testing if needed
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    */
  ],
});