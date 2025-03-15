/**
 * Mock for Obsidian API types
 * This file provides mock implementations of Obsidian objects and interfaces
 * needed for testing Cerebro plugin components
 */

// Add a simple test to avoid the "Your test suite must contain at least one test" error
describe("Obsidian Mocks", () => {
	it("should have required mocks", () => {
		expect(App).toBeDefined();
		expect(Editor).toBeDefined();
		expect(MarkdownView).toBeDefined();
	});
});

// Mock App
export class App {
	vault: Vault;
	workspace: Workspace;
	metadataCache: MetadataCache;
	fileManager: FileManager;
	keymap: any = {};
	scope: any = {};
	lastEvent: any = null;

	constructor() {
		this.vault = new Vault();
		this.workspace = new Workspace();
		this.metadataCache = new MetadataCache();
		this.fileManager = new FileManager();
	}
}

// Mock Vault
export class Vault {
	adapter = {
		exists: jest.fn().mockResolvedValue(false),
		read: jest.fn().mockResolvedValue(""),
		write: jest.fn().mockResolvedValue(undefined),
	};

	createFolder = jest.fn().mockResolvedValue(undefined);
	delete = jest.fn().mockResolvedValue(undefined);
	rename = jest.fn().mockResolvedValue(undefined);

	cachedRead = jest.fn().mockResolvedValue("");
	readBinary = jest.fn().mockResolvedValue(new ArrayBuffer(0));
}

// Mock Workspace
export class Workspace {
	activeLeaf: WorkspaceLeaf | null = null;

	getActiveFile = jest.fn().mockReturnValue(null);
	getActiveViewOfType = jest.fn().mockReturnValue(null);

	on = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
	off = jest.fn();

	onLayoutReady = jest.fn().mockImplementation((callback) => {
		callback();
		return { unsubscribe: jest.fn() };
	});
}

// Mock WorkspaceLeaf
export class WorkspaceLeaf {
	view: any = null;

	getViewState = jest.fn().mockReturnValue({
		type: "markdown",
		state: {},
	});

	setViewState = jest.fn().mockResolvedValue(undefined);
}

// Mock MetadataCache
export class MetadataCache {
	getFileCache = jest.fn().mockReturnValue({
		frontmatter: {},
		links: [],
		embeds: [],
	});

	getFirstLinkpathDest = jest.fn().mockReturnValue(null);
	getCache = jest.fn().mockReturnValue({});
}

// Mock FileManager
export class FileManager {
	processFrontMatter = jest.fn().mockImplementation((file, callback) => {
		const frontmatter = {};
		callback(frontmatter);
		return Promise.resolve();
	});

	renameFile = jest.fn().mockImplementation((file, newPath) => {
		return Promise.resolve(file);
	});
}

// Mock TFile
export class TFile {
	path: string;
	name: string;
	basename: string;
	extension: string;

	constructor(path = "", name = "", extension = "md") {
		this.path = path;
		this.name = name;
		this.basename = name.replace(`.${extension}`, "");
		this.extension = extension;
	}
}

// Mock Editor
export class Editor {
	// Core Editor methods
	getValue = jest.fn().mockReturnValue("");
	setValue = jest.fn();
	getLine = jest.fn().mockReturnValue("");
	replaceRange = jest.fn();
	getSelection = jest.fn().mockReturnValue("");
	setCursor = jest.fn();
	getCursor = jest.fn().mockReturnValue({ line: 0, ch: 0 });
	lastLine = jest.fn().mockReturnValue(0);

	// Additional required methods
	getDoc = jest.fn().mockReturnValue({ getValue: () => "", setCursor: jest.fn() });
	refresh = jest.fn();
	setLine = jest.fn();
	lineCount = jest.fn().mockReturnValue(0);

	// Methods used in Cerebro
	focus = jest.fn();
	hasFocus = jest.fn().mockReturnValue(true);
	getScrollInfo = jest.fn().mockReturnValue({ top: 0, left: 0 });
	scrollTo = jest.fn();
	posAtCoords = jest.fn().mockReturnValue({ line: 0, ch: 0 });
	coordsAtPos = jest.fn().mockReturnValue({ top: 0, left: 0 });
	getRange = jest.fn().mockReturnValue("");
	somethingSelected = jest.fn().mockReturnValue(false);

	// Mock for CM6 editor
	cm = {
		state: {
			doc: {
				line: jest.fn().mockReturnValue({ from: 0, to: 0, text: "" }),
				length: 0,
			},
		},
		dispatch: jest.fn(),
		scrollDOM: {
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
		},
	};
}

// Mock MarkdownView
export class MarkdownView {
	file: TFile | null = null;
	editor = new Editor();

	getViewData = jest.fn().mockReturnValue("");
	setViewData = jest.fn().mockImplementation((data, clear) => Promise.resolve());

	getMode = jest.fn().mockReturnValue("source");
	getState = jest.fn().mockReturnValue({});
}

// Mock Notice
export class Notice {
	constructor(message: string, timeout?: number) {
		// Mock implementation - could log to console for testing
		console.log(`NOTICE: ${message}`);
	}
}

// Mock EditorPosition
export interface EditorPosition {
	line: number;
	ch: number;
}

// Set up exports to match Obsidian's structure
export default {
	App,
	Editor,
	MarkdownView,
	Notice,
	TFile,
	Vault,
	Workspace,
	WorkspaceLeaf,
};
