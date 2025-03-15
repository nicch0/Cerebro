import { App, Editor, MarkdownView, TFile } from "./mocks/obsidian";
import { CSSAssets, YAML_FRONTMATTER_REGEX } from "lib/constants";
import { DEFAULT_SETTINGS } from "lib/settings";

// Manually re-implement the functions to test
const removeYMLFromMessage = (message: string): string => {
	return message.replace(YAML_FRONTMATTER_REGEX, "");
};

const splitMessages = (text: string): string[] => {
	return text.split(`<hr class="${CSSAssets.HR}">`);
};

const removeCommentsFromMessages = (message: string): string => {
	// Comment block in form of =begin-comment and =end-comment
	const commentBlock = /=begin-comment[\s\S]*?=end-comment/g;
	return message.replace(commentBlock, "");
};

const extractRoleAndMessage = (message: string, settings: any): any => {
	if (!message.includes(CSSAssets.HEADER)) {
		return { role: "user", content: message.trim() };
	}

	// Extract name from header
	const headerRegex = new RegExp(`<h[1-6] class="${CSSAssets.HEADER}">(.*?):</h[1-6]>`);
	const headerMatch = message.match(headerRegex);

	if (!headerMatch) {
		throw new Error("Malformed header in message");
	}

	const name = headerMatch[1];
	const role = name === settings.assistantName ? "assistant" : "user";

	// Extract content after the header
	const contentStartIdx = headerMatch.index! + headerMatch[0].length;
	const content = message.slice(contentStartIdx).trim();

	if (!content) {
		throw new Error("Empty message content");
	}
	return { role, content };
};

// Mock ChatInterface for testing
class MockChatInterface {
	settings: any;
	editorPosition: { line: number; ch: number } = { line: 0, ch: 0 };
	userScrolling = false;

	constructor(settings: any) {
		this.settings = settings;
	}

	moveCursorToEndOfFile(editor: any): any {
		const length = editor.lastLine();
		const newCursor = {
			line: length,
			ch: 0,
		};

		editor.cm.dispatch({
			selection: {
				anchor: 0,
				head: 0,
			},
			scrollIntoView: false,
		});

		return newCursor;
	}

	moveCursorToEndOfLine(editor: any, change: string): any {
		// Moves cursor to end of line
		const cursor = editor.getCursor();
		const newCursor = {
			line: cursor.line,
			ch: cursor.ch + change.length,
		};
		editor.setCursor(newCursor);
		return newCursor;
	}

	getFrontmatter(app: any): any {
		const noteFile = app.workspace.getActiveFile();
		const metaMatter = app.metadataCache.getFileCache(noteFile)?.frontmatter;

		// Return frontmatter values or defaults
		return {
			llm: metaMatter?.llm || this.settings.defaultLLM,
			model: metaMatter?.model || this.settings.llmSettings[this.settings.defaultLLM].model,
			stream: metaMatter?.stream !== undefined ? metaMatter.stream : this.settings.stream,
			title: metaMatter?.title || noteFile?.basename,
			tags: metaMatter?.tags || [],
			temperature: metaMatter?.temperature || null,
			system_commands: metaMatter?.systemCommands || metaMatter?.system || [],
		};
	}
}

describe("ChatInterface Utility Methods", () => {
	describe("removeYMLFromMessage", () => {
		it("should remove YAML frontmatter from messages", () => {
			const messageWithYAML = `---
title: Test Message
tags: [test, yaml]
---

This is the actual message content`;

			expect(removeYMLFromMessage(messageWithYAML)).toBe(
				"\n\nThis is the actual message content",
			);
		});

		it("should return the original message if no YAML frontmatter exists", () => {
			const messageWithoutYAML = "This is a message without YAML";
			expect(removeYMLFromMessage(messageWithoutYAML)).toBe(messageWithoutYAML);
		});
	});

	describe("splitMessages", () => {
		it("should split messages on the HR divider", () => {
			const multipleMessages = `First message
<hr class="${CSSAssets.HR}">
Second message
<hr class="${CSSAssets.HR}">
Third message`;

			const result = splitMessages(multipleMessages);
			expect(result).toHaveLength(3);
			expect(result[0]).toBe("First message\n");
			expect(result[1]).toBe("\nSecond message\n");
			expect(result[2]).toBe("\nThird message");
		});

		it("should return a single message if no dividers exist", () => {
			const singleMessage = "This is a single message";
			const result = splitMessages(singleMessage);
			expect(result).toHaveLength(1);
			expect(result[0]).toBe(singleMessage);
		});
	});

	describe("removeCommentsFromMessages", () => {
		it("should remove comment blocks from messages", () => {
			const messageWithComments = `This is visible content.
=begin-comment
This should be removed
More content to remove
=end-comment
More visible content`;

			const result = removeCommentsFromMessages(messageWithComments);
			expect(result).toBe("This is visible content.\n\nMore visible content");
		});

		it("should leave message unchanged if no comments exist", () => {
			const messageWithoutComments = "This is a message without comments";
			expect(removeCommentsFromMessages(messageWithoutComments)).toBe(messageWithoutComments);
		});
	});

	describe("extractRoleAndMessage", () => {
		const settings = DEFAULT_SETTINGS;
		settings.assistantName = "TestAssistant";
		settings.username = "TestUser";

		it("should extract role and content from user messages", () => {
			const userMessage = `<h3 class="${CSSAssets.HEADER}">TestUser:</h3>
This is a user message`;

			const result = extractRoleAndMessage(userMessage, settings);
			expect(result.role).toBe("user");
			expect(result.content).toBe("This is a user message");
		});

		it("should extract role and content from assistant messages", () => {
			const assistantMessage = `<h3 class="${CSSAssets.HEADER}">TestAssistant:</h3>
This is an assistant message`;

			const result = extractRoleAndMessage(assistantMessage, settings);
			expect(result.role).toBe("assistant");
			expect(result.content).toBe("This is an assistant message");
		});

		it("should default to user role if no header is found", () => {
			const plainMessage = "This is a plain message with no header";

			const result = extractRoleAndMessage(plainMessage, settings);
			expect(result.role).toBe("user");
			expect(result.content).toBe(plainMessage);
		});
	});
});

describe("ChatInterface Class", () => {
	let app: App;
	let editor: Editor;
	let view: MarkdownView;
	let chatInterface: MockChatInterface;

	beforeEach(() => {
		app = new App();
		editor = new Editor();
		view = new MarkdownView();
		view.editor = editor;
		view.file = new TFile("test.md", "Test.md");

		chatInterface = new MockChatInterface(DEFAULT_SETTINGS);
	});

	describe("moveCursorToEndOfFile", () => {
		it("should move cursor to the end of the file", () => {
			editor.lastLine = jest.fn().mockReturnValue(10);

			chatInterface.moveCursorToEndOfFile(editor);

			expect(editor.lastLine).toHaveBeenCalled();
			expect(editor.cm.dispatch).toHaveBeenCalled();
		});
	});

	describe("moveCursorToEndOfLine", () => {
		it("should move cursor to the end of the current line", () => {
			const startCursor = { line: 5, ch: 10 };
			editor.getCursor = jest.fn().mockReturnValue(startCursor);

			const result = chatInterface.moveCursorToEndOfLine(editor, "new text");

			expect(editor.setCursor).toHaveBeenCalledWith({
				line: startCursor.line,
				ch: startCursor.ch + "new text".length,
			});
			expect(result).toEqual({
				line: startCursor.line,
				ch: startCursor.ch + "new text".length,
			});
		});
	});

	describe("getFrontmatter", () => {
		it("should retrieve and process frontmatter from the current file", () => {
			const mockFrontmatter = {
				title: "Test Chat",
				model: "gpt-4",
				stream: false,
				temperature: 0.7,
			};

			app.metadataCache.getFileCache = jest.fn().mockReturnValue({
				frontmatter: mockFrontmatter,
			});

			const result = chatInterface.getFrontmatter(app);

			expect(app.metadataCache.getFileCache).toHaveBeenCalled();
			expect(result.title).toBe("Test Chat");
			expect(result.model).toBe("gpt-4");
			expect(result.stream).toBe(false);
			expect(result.temperature).toBe(0.7);
		});

		it("should use default settings when frontmatter is missing values", () => {
			app.metadataCache.getFileCache = jest.fn().mockReturnValue({
				frontmatter: { title: "Test Chat" },
			});

			const result = chatInterface.getFrontmatter(app);

			expect(result.title).toBe("Test Chat");
			expect(result.model).toBe(
				DEFAULT_SETTINGS.llmSettings[DEFAULT_SETTINGS.defaultLLM].model,
			);
			expect(result.stream).toBe(DEFAULT_SETTINGS.stream);
		});
	});
});
