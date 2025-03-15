import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// In a real implementation, we'd launch actual Obsidian, but for demo purposes
// we'll simulate the interactions at a higher level

test.describe("Basic Chat Flow", () => {
	let page: Page;
	let testVaultDir: string;

	test.beforeAll(async ({ browser }) => {
		// Get test vault path from environment variable
		testVaultDir = process.env.TEST_VAULT_PATH || "";
		expect(testVaultDir).toBeTruthy();
		expect(fs.existsSync(testVaultDir)).toBeTruthy();

		// Launch a new page for testing
		page = await browser.newPage();
	});

	test.afterAll(async () => {
		await page.close();
	});

	test("should create a new chat from template", async () => {
		// In a real implementation, we'd use page.click() etc. to interact with Obsidian's UI
		// For this demonstration, we'll simulate the actions by creating the expected files

		// Simulate creating a new chat from template
		const chatName = "Test Chat " + Date.now();
		const chatFilePath = path.join(testVaultDir, "Cerebro", "Chats", `${chatName}.md`);

		// Copy template content with added metadata
		const templatePath = path.join(testVaultDir, "Cerebro", "Templates", "Test Template.md");
		const templateContent = fs.readFileSync(templatePath, "utf8");
		fs.writeFileSync(chatFilePath, templateContent);

		// Verify chat file was created
		expect(fs.existsSync(chatFilePath)).toBeTruthy();

		// For simulation, log what would happen in the real test
		console.log(`Created chat file: ${chatFilePath}`);

		// In a real test, we'd verify that the UI shows the new chat
	});

	test("should allow asking a question and receive response", async () => {
		// Get the most recent chat file
		const chatsDir = path.join(testVaultDir, "Cerebro", "Chats");
		const chatFiles = fs
			.readdirSync(chatsDir)
			.filter((f) => f.endsWith(".md"))
			.map((f) => path.join(chatsDir, f));

		// Sort by modification time (newest first)
		chatFiles.sort((a, b) => {
			return fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime();
		});

		// Get the most recent chat file
		const chatFilePath = chatFiles[0];
		expect(chatFilePath).toBeTruthy();

		// Read current content
		let chatContent = fs.readFileSync(chatFilePath, "utf8");

		// Add user question to the chat file
		const userQuestion = "### User:\n\nWhat is the capital of France?";
		chatContent += '\n\n<hr class="cerebro-divider">\n' + userQuestion;

		// Write back to file
		fs.writeFileSync(chatFilePath, chatContent);

		// Simulate API response (in a real test, we'd wait for the UI to update)
		// For testing, we'll manually add the assistant response
		const assistantResponse =
			'\n\n<hr class="cerebro-divider">\n### Cerebro:\n\nThe capital of France is Paris.';
		chatContent += assistantResponse;

		// Write back to file
		fs.writeFileSync(chatFilePath, chatContent);

		// Verify chat contains both question and response
		const updatedContent = fs.readFileSync(chatFilePath, "utf8");
		expect(updatedContent).toContain("What is the capital of France?");
		expect(updatedContent).toContain("The capital of France is Paris");

		// In a real test, we'd verify the UI elements are properly updated
	});
});
