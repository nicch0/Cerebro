import * as fs from "fs";
import * as path from "path";

/**
 * Creates and populates a test vault for Obsidian
 *
 * @param vaultPath Path where the test vault will be created
 */
export async function prepareTestVault(vaultPath: string): Promise<void> {
	// Create main vault directory if it doesn't exist
	if (!fs.existsSync(vaultPath)) {
		fs.mkdirSync(vaultPath, { recursive: true });
	}

	// Create Obsidian config directory
	const obsidianDir = path.join(vaultPath, ".obsidian");
	if (!fs.existsSync(obsidianDir)) {
		fs.mkdirSync(obsidianDir, { recursive: true });
	}

	// Create plugins directory
	const pluginsDir = path.join(obsidianDir, "plugins");
	if (!fs.existsSync(pluginsDir)) {
		fs.mkdirSync(pluginsDir, { recursive: true });
	}

	// Create Cerebro directory
	const cerebroDir = path.join(pluginsDir, "Cerebro");
	if (!fs.existsSync(cerebroDir)) {
		fs.mkdirSync(cerebroDir, { recursive: true });
	}

	// Copy the necessary plugin files
	const sourcePluginDir = path.join(process.cwd()); // Current directory is the plugin root

	// Copy main.js (compiled plugin)
	if (fs.existsSync(path.join(sourcePluginDir, "main.js"))) {
		fs.copyFileSync(path.join(sourcePluginDir, "main.js"), path.join(cerebroDir, "main.js"));
	}

	// Copy manifest.json
	if (fs.existsSync(path.join(sourcePluginDir, "manifest.json"))) {
		fs.copyFileSync(
			path.join(sourcePluginDir, "manifest.json"),
			path.join(cerebroDir, "manifest.json"),
		);
	}

	// Copy styles.css
	if (fs.existsSync(path.join(sourcePluginDir, "styles.css"))) {
		fs.copyFileSync(
			path.join(sourcePluginDir, "styles.css"),
			path.join(cerebroDir, "styles.css"),
		);
	}

	// Create Cerebro/Chats directory
	const chatsDir = path.join(vaultPath, "Cerebro", "Chats");
	fs.mkdirSync(chatsDir, { recursive: true });

	// Create Cerebro/Templates directory
	const templatesDir = path.join(vaultPath, "Cerebro", "Templates");
	fs.mkdirSync(templatesDir, { recursive: true });

	// Create a test template
	const templateContent = `---
system_commands: ['I am a helpful assistant for testing.']
temperature: 0
model: claude-3-5-haiku-latest
llm: Anthropic
stream: true
---

# Test Template

This is a template for testing Cerebro.`;

	fs.writeFileSync(path.join(templatesDir, "Test Template.md"), templateContent);

	// Create basic plugin config in data.json
	const dataJson = {
		pluginEnabledStatus: {
			Cerebro: true,
		},
		plugins: {
			Cerebro: {
				chatFolder: "Cerebro/Chats",
				chatTemplateFolder: "Cerebro/Templates",
				defaultLLM: "Anthropic",
				llmSettings: {
					Anthropic: {
						apiKey: "test-api-key",
						model: "claude-3-5-haiku-latest",
					},
				},
			},
		},
	};

	fs.writeFileSync(path.join(obsidianDir, "data.json"), JSON.stringify(dataJson, null, 2));

	console.log("Test vault prepared successfully");
}
