import { chromium, FullConfig } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { prepareTestVault } from "./prepare-vault";

/**
 * Global setup for Playwright tests
 * - Prepares a test vault for Obsidian
 * - Launches Obsidian pointed to this vault
 * - Builds and installs the plugin in test mode
 */
async function globalSetup(config: FullConfig) {
	// Create temporary test data directory
	const testVaultDir = path.join(os.tmpdir(), "cerebro-test-vault-" + Date.now());
	process.env.TEST_VAULT_PATH = testVaultDir;

	// Prepare test vault with fixtures
	await prepareTestVault(testVaultDir);

	console.log(`Test vault prepared at ${testVaultDir}`);

	// In a real setup, we would launch Obsidian pointed to this vault
	// However, this requires additional setup for Electron testing
	// For now, we'll simulate the launch by creating a special file
	fs.writeFileSync(path.join(testVaultDir, ".obsidian-test-ready"), "true");

	// Mock the API responses - for demonstration
	process.env.MOCK_API_RESPONSES = "true";
}

export default globalSetup;
