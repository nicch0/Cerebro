import {
	ChatFrontmatter,
	DocumentMessageContent,
	EditorWithCM6,
	ImageExtension,
	ImageExtensionToMimeType,
	ImageMessageContent,
	ImageSource,
	Message,
	PDFSource,
	TextMessageContent,
} from "lib/types";
import { App, Editor, EditorPosition, MarkdownView, TFile } from "obsidian";
import {
	assistantHeader,
	CSSAssets,
	MAX_DOCUMENT_DEPTH,
	userHeader,
	YAML_FRONTMATTER_REGEX,
} from "./constants";
import {
	getCerebroBaseSystemPrompts,
	isValidFileExtension,
	isValidImageExtension,
	isValidPDFExtension,
} from "./helpers";
import { logger } from "./logger";
import { CerebroSettings, DEFAULT_SETTINGS } from "./settings";

export type ShouldContinue = boolean;

const removeYMLFromMessage = (message: string): string => {
	/**
	 * Removes any YAML content from a message
	 */
	try {
		return message.replace(YAML_FRONTMATTER_REGEX, "");
	} catch (err) {
		throw new Error("Error removing YML from message" + err);
	}
};

const splitMessages = (text: string): string[] => {
	/**
	 * Splits a string based on the separator
	 */
	try {
		return text.split(`<hr class="${CSSAssets.HR}">`);
	} catch (err) {
		throw new Error("Error splitting messages" + err);
	}
};

const removeCommentsFromMessages = (message: string): string => {
	/**
	 * Removes any comments from the messages
	 */
	try {
		// Comment block in form of =begin-comment and =end-comment
		const commentBlock = /=begin-comment[\s\S]*?=end-comment/g;

		// Remove comment block
		return message.replace(commentBlock, "");
	} catch (err) {
		throw new Error("Error removing comments from messages" + err);
	}
};

// const escapeRegExp = (text: string): string => {
// 	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// };

const extractRoleAndMessage = (message: string, settings: CerebroSettings): Message => {
	try {
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
	} catch (err) {
		throw new Error("Error extracting role and message" + err);
	}
};

export default class ChatInterface {
	private editor: Editor;
	private view: MarkdownView;
	public stopStreaming = false;
	public userScrolling = false;

	public settings: CerebroSettings;
	public editorPosition: EditorPosition;

	constructor(settings: CerebroSettings, editor: Editor, view: MarkdownView) {
		this.settings = settings;
		this.editor = editor;
		this.view = view;
		this.initScrollTracking();
	}

	private initScrollTracking(): void {
		const cm6editor = this.editor as EditorWithCM6;
		const handleWheel = (e: WheelEvent): void => {
			if (e.deltaY !== 0 && !this.userScrolling) {
				this.userScrolling = true;
				logger.debug("[Cerebro] User started scrolling (wheel event)");
			}
		};
		cm6editor.cm.scrollDOM.addEventListener("wheel", handleWheel);
	}

	public async getMessages(app: App): Promise<{
		messages: Message[];
		files: Set<string>;
	}> {
		// Retrieve and process messages
		const rawEditorVal = this.editor.getValue();
		const bodyWithoutYML = removeYMLFromMessage(rawEditorVal);
		const messages = splitMessages(bodyWithoutYML)
			.map((message) => removeCommentsFromMessages(message))
			.map((message) => extractRoleAndMessage(message, this.settings));

		const processedFiles = new Set<string>();
		const messagesWithFiles = await Promise.all(
			messages.map((message) => this.parseFilesFromMessage(app, message, 1, processedFiles)),
		);
		return {
			messages: messagesWithFiles,
			files: processedFiles,
		};
	}

	public async updateFrontmatterWithFiles(app: App, processedFiles: Set<string>): Promise<void> {
		try {
			const activeFile = this.view.file;
			if (!activeFile) {
				throw new Error("No active file");
			}

			// Convert files to Obsidian wiki link format
			const linkedFiles = Array.from(processedFiles).map((file) => `[[${file}]]`);

			console.log("linkedFiles", linkedFiles);
			// Use Obsidian's metadata API
			await app.fileManager.processFrontMatter(activeFile, (frontmatter) => {
				frontmatter.files = linkedFiles;
			});
		} catch (err) {
			logger.error("Error updating frontmatter with files:", err);
			throw new Error("Failed to update frontmatter with files");
		}
	}

	public addHR(): void {
		const newLine = `\n<hr class="${CSSAssets.HR}">\n${userHeader(this.settings.username, this.settings.headingLevel)}\n`;
		this.editor.replaceRange(newLine, this.editor.getCursor());

		// Move cursor to end of file
		const cursor = this.editor.getCursor();
		const newCursor = {
			line: cursor.line,
			ch: cursor.ch + newLine.length,
		};
		this.editor.setCursor(newCursor);
	}

	public completeUserResponse(): void {
		/**
		 * 1. Moves cursor to end of line
		 * 2. Places divider
		 * 3. Completes the user's response by placing the assistant's header
		 */
		this.moveCursorToEndOfFile(this.editor);
		const newLine = `\n\n<hr class="${CSSAssets.HR}">\n${assistantHeader(this.settings.assistantName, this.settings.headingLevel)}\n`;

		const cm6editor = this.editor as EditorWithCM6;
		const cursor = this.editor.getCursor();
		const line = cm6editor.cm.state.doc.line(cursor.line + 1).from;

		cm6editor.cm.dispatch({
			changes: {
				from: line + cursor.ch,
				insert: newLine,
			},
			selection: {
				anchor: line + cursor.ch + newLine.length,
				head: line + cursor.ch + newLine.length,
			},
			scrollIntoView: !this.userScrolling,
		});

		this.editorPosition = {
			line: cursor.line,
			ch: cursor.ch + newLine.length,
		};
		this.userScrolling = false;
	}

	public completeAssistantResponse(): void {
		/**
		 * 1. Places divider
		 * 2. Completes the assistants response by placing the user's header
		 * 3. Moves cursor to end of line
		 */
		const newLine = `\n\n<hr class="${CSSAssets.HR}">\n${userHeader(this.settings.username, this.settings.headingLevel)}\n`;
		const cm6editor = this.editor as EditorWithCM6;
		const cursor = this.editor.getCursor();
		const line = cm6editor.cm.state.doc.line(cursor.line + 1).from;
		cm6editor.cm.dispatch({
			changes: {
				from: line + cursor.ch,
				insert: newLine,
			},
			selection: {
				anchor: line + cursor.ch + newLine.length,
				head: line + cursor.ch + newLine.length,
			},
			scrollIntoView: !this.userScrolling,
		});

		this.editorPosition = {
			line: cursor.line,
			ch: cursor.ch + newLine.length,
		};
		this.userScrolling = false;
	}

	public appendNonStreamingMessage(message: string): void {
		/**
		 * 1. Places assistant's response
		 * 2. Moves cursor to end of line
		 */
		this.editor.replaceRange(message, this.editor.getCursor());
		this.editorPosition = this.moveCursorToEndOfLine(this.editor, message);
	}

	public moveCursorToEndOfFile(editor: Editor): EditorPosition {
		try {
			const length = editor.lastLine();
			const newCursor = {
				line: length,
				ch: 0,
			};

			// Use CM6 transaction to move cursor without scrolling
			const cm6editor = editor as EditorWithCM6;
			const line = cm6editor.cm.state.doc.line(newCursor.line + 1).from;

			cm6editor.cm.dispatch({
				selection: {
					anchor: line + newCursor.ch,
					head: line + newCursor.ch,
				},
				scrollIntoView: false,
			});

			return newCursor;
		} catch (err) {
			throw new Error("Error moving cursor to end of file" + err);
		}
	}

	public moveCursorToEndOfLine(editor: Editor, change: string): EditorPosition {
		// Moves cursor to end of line
		const cursor = editor.getCursor();
		const newCursor: EditorPosition = {
			line: cursor.line,
			ch: cursor.ch + change.length,
		};
		editor.setCursor(newCursor);
		return newCursor;
	}

	private getHeadingPrefix(headingLevel: number): string {
		if (headingLevel === 0) {
			return "";
		} else if (headingLevel > 6) {
			return "#".repeat(6) + " ";
		}
		return "#".repeat(headingLevel) + " ";
	}

	public updateSettings(settings: CerebroSettings): void {
		logger.info("Saving settings in ChatController");
		this.settings = settings;
	}

	public getFrontmatter(app: App): ChatFrontmatter {
		/**
		 * Retrieves the frontmatter from a markdown file
		 */
		try {
			// Retrieve frontmatter
			const noteFile = app.workspace.getActiveFile();

			if (!noteFile) {
				throw new Error("No active file");
			}

			const metaMatter = app.metadataCache.getFileCache(noteFile)?.frontmatter;

			// Checks three layers in decreasing priority - frontmatter, user settings, then default settings
			const stream =
				metaMatter?.stream !== undefined
					? metaMatter.stream // If defined in frontmatter, use its value.
					: this.settings.stream !== undefined
						? this.settings.stream // If not defined in frontmatter but exists globally, use its value.
						: DEFAULT_SETTINGS.stream; // Otherwise fallback on true.

			const llm =
				metaMatter?.llm !== undefined
					? metaMatter.llm
					: this.settings.defaultLLM || DEFAULT_SETTINGS.defaultLLM;

			const model =
				metaMatter?.model !== undefined
					? metaMatter.model
					: this.settings.llmSettings[this.settings.defaultLLM].model;

			const system_commands = [
				...getCerebroBaseSystemPrompts(this.settings),
				metaMatter?.systemCommands || metaMatter?.system || [],
			];

			return {
				llm,
				model,
				stream,
				title: metaMatter?.title || this.view.file?.basename,
				tags: metaMatter?.tags || [],
				temperature: metaMatter?.temperature || null,
				top_p: metaMatter?.top_p || null,
				presence_penalty: metaMatter?.presence_penalty || null,
				frequency_penalty: metaMatter?.frequency_penalty || null,
				max_tokens: metaMatter?.max_tokens || null,
				stop: metaMatter?.stop || null,
				n: metaMatter?.n || null,
				logit_bias: metaMatter?.logit_bias || null,
				user: metaMatter?.user || null,
				system_commands,
			};
		} catch (err) {
			throw new Error("Error getting frontmatter");
		}
	}

	public addStreamedChunk(chunkText: string): ShouldContinue {
		if (this.stopStreaming) {
			logger.info("Stopping stream...");
			return false;
		}
		const cm6editor = this.editor as EditorWithCM6;
		const cursor = this.editor.getCursor();
		const line = cm6editor.cm.state.doc.line(cursor.line + 1).from;

		// Create a transaction that adds text without scrolling
		cm6editor.cm.dispatch({
			changes: {
				from: line + cursor.ch,
				insert: chunkText,
			},
			selection: {
				anchor: line + cursor.ch + chunkText.length,
				head: line + cursor.ch + chunkText.length,
			},
			scrollIntoView: !this.userScrolling,
		});

		return true;
	}

	public finalizeStreamedResponse(
		fullResponse: string,
		{ line: initialLine, ch: initialCh }: EditorPosition,
	): void {
		const cm6editor = this.editor as EditorWithCM6;
		const endCursor = this.editor.getCursor();
		const initialPos = cm6editor.cm.state.doc.line(initialLine + 1).from + initialCh;
		const endPos = cm6editor.cm.state.doc.line(endCursor.line + 1).from + endCursor.ch;

		// First transaction: Replace text from initialCursor to endCursor
		cm6editor.cm.dispatch({
			changes: [
				{
					from: initialPos,
					to: endPos,
					insert: fullResponse,
				},
				// Also remove any text after the cursor to the end of document
				{
					from: initialPos + fullResponse.length,
					to: cm6editor.cm.state.doc.length,
				},
			],
			selection: {
				anchor: initialPos + fullResponse.length,
				head: initialPos + fullResponse.length,
			},
			scrollIntoView: !this.userScrolling,
		});

		this.stopStreaming = false;
	}

	private async parseFilesFromMessage(
		app: App,
		message: Message,
		depth: number,
		processedFiles: Set<string>,
	): Promise<Message> {
		// Stop if we've exceeded the max depth
		if (depth > MAX_DOCUMENT_DEPTH) {
			return message;
		}

		// Matches Obsidian-style wiki links [[file]] or [[file|alias]], but ignores any matches inside inline code blocks
		// (?<!`[^`]*)     - Negative lookbehind to ensure not preceded by backtick
		// \[\[            - Match opening [[
		// (.*?)           - Capture any characters (non-greedy) for filename
		// (?:\|.*?)?      - Optionally match | followed by alias text (non-capturing)
		// \]\]            - Match closing ]]
		// (?![^`]*`)      - Negative lookahead to ensure not inside code block
		const fileRegex = /(?<!`[^`]*)\[\[(.*?)(?:\|.*?)?\]\](?![^`]*`)/g;

		const images: ImageMessageContent[] = [];
		const texts: TextMessageContent[] = [];
		const pdfs: DocumentMessageContent[] = [];

		// If message.content is an array, we only process the text contents
		const contentToProcess = Array.isArray(message.content)
			? message.content
					.filter((c) => c.type === "text")
					.map((c) => (c as TextMessageContent).text)
					.join("\n")
			: (message.content as string);

		// Find any file matches
		const filesMatches = contentToProcess.match(fileRegex);
		if (!filesMatches) {
			return message;
		}
		for (const match of filesMatches) {
			const filePath = match.replace(/\[\[|\]\]/g, "").split("|")[0];
			const file = app.metadataCache.getFirstLinkpathDest(filePath, "");

			// Skip if we've already processed this file to prevent cycles
			if (processedFiles.has(filePath)) {
				continue;
			}
			processedFiles.add(filePath);

			if (file && file instanceof TFile) {
				if (isValidImageExtension(file?.extension)) {
					try {
						images.push({
							type: "image",
							source: await this.getImageSourceFromFile(app, file),
							originalPath: filePath,
						});
					} catch (error) {
						console.error(`Failed to process image ${filePath}:`, error);
					}
				} else if (isValidPDFExtension(file?.extension)) {
					try {
						pdfs.push({
							type: "document",
							source: await this.getPDFSourceFromFile(app, file),
							originalPath: filePath,
						});
					} catch (error) {
						console.error(`Failed to process PDF ${filePath}:`, error);
					}
				} else if (isValidFileExtension(file?.extension)) {
					try {
						const fileContent = await app.vault.cachedRead(file);
						// Remove YAML frontmatter before processing the file content
						const contentWithoutYAML = removeYMLFromMessage(fileContent);
						const nestedContent = await this.parseFilesFromMessage(
							app,
							{ role: "user", content: contentWithoutYAML },
							depth + 1,
							processedFiles,
						);

						texts.push({
							type: "text",
							text: fileContent,
							originalPath: filePath,
							resolvedContent: Array.isArray(nestedContent.content)
								? nestedContent.content
								: undefined,
						});
					} catch (error) {
						console.error(`Failed to process file ${filePath}:`, error);
					}
				}
			}
		}

		return {
			...message,
			content: [
				{
					type: "text",
					text: contentToProcess,
				},
				...images,
				...texts,
				...pdfs,
			],
		};
	}

	public clearConversationExceptFrontmatter(editor: Editor): EditorPosition {
		try {
			// Retrieve frontmatter text (not the object)
			const frontmatter = editor.getValue().match(YAML_FRONTMATTER_REGEX);

			if (!frontmatter) {
				throw new Error("no frontmatter found");
			}

			// clear editor
			editor.setValue("");

			// add frontmatter back
			editor.replaceRange(frontmatter[0], editor.getCursor());

			// get length of file
			const length = editor.lastLine();

			// move cursor to end of file https://davidwalsh.name/codemirror-set-focus-line
			const newCursor = {
				line: length + 1,
				ch: 0,
			};

			editor.setCursor(newCursor);

			return newCursor;
		} catch (err) {
			throw new Error("Error clearing conversation" + err);
		}
	}

	private async getImageSourceFromFile(app: App, image: TFile): Promise<ImageSource> {
		// Read the file as an array buffer
		const arrayBuffer = await app.vault.readBinary(image);

		// Convert array buffer to base64
		const base64 = Buffer.from(arrayBuffer).toString("base64");

		// Get the file extension
		// const fileExtension = image.extension.toLowerCase();

		// Return with proper mime type prefix
		const mimeType = ImageExtensionToMimeType[image.extension.toUpperCase() as ImageExtension];

		return {
			type: "base64",
			media_type: mimeType,
			data: base64,
		};
	}

	private async getPDFSourceFromFile(app: App, pdfFile: TFile): Promise<PDFSource> {
		// Read the file as an array buffer
		const arrayBuffer = await app.vault.readBinary(pdfFile);

		// Convert array buffer to base64
		const base64 = Buffer.from(arrayBuffer).toString("base64");

		return {
			type: "base64",
			media_type: "application/pdf",
			data: base64,
		};
	}

	private async getMessageTextFromFile(app: App, textFile: TFile): Promise<TextMessageContent> {
		const text = await app.vault.cachedRead(textFile);

		return {
			type: "text",
			text,
		};
	}
}
