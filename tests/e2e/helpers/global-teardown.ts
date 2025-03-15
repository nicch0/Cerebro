import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';

/**
 * Global teardown for Playwright tests
 * - Closes Obsidian
 * - Cleans up temporary test data
 */
async function globalTeardown(config: FullConfig) {
  // Get the test vault path from environment variable
  const testVaultDir = process.env.TEST_VAULT_PATH;
  
  if (testVaultDir && fs.existsSync(testVaultDir)) {
    console.log(`Cleaning up test vault at ${testVaultDir}`);
    
    // Clean up the test vault directory
    try {
      // For safety, verify it's a test vault before removing
      if (fs.existsSync(path.join(testVaultDir, '.obsidian-test-ready'))) {
        // Use rimraf for recursive deletion (or fs.rm with recursive option in Node 14+)
        rimraf.sync(testVaultDir);
      }
    } catch (err) {
      console.error('Error cleaning up test vault:', err);
    }
  }
  
  // Reset environment variables
  process.env.TEST_VAULT_PATH = '';
  process.env.MOCK_API_RESPONSES = '';
}

export default globalTeardown;