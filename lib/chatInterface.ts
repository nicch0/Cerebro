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
import { CerebroSettings } from "./settings";

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

const extractRoleAndMessage = (message: string, settings: CerebroSettings): Message => {
    try {
        if (!message.includes(CSSAssets.HEADER)) {
            return { role: "user", content: message.trim() };
        }

        // Extract name from header
        const headerRegex = new RegExp(`<h[1-6] class="${CSSAssets.HEADER}">(.*?)(?::)?</h[1-6]>`);
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

// Helper function to parse content for image URLs
const parseMessageForUrls = (message: Message): Message => {
    if (typeof message.content !== "string") {
        return message;
    }

    const content = message.content;
    // Regex to match both direct URLs and Markdown image syntax
    const imageUrlRegex =
        /(?:!\[.*?\]\((https?:\/\/[^\s)]+?\.(?:jpg|jpeg|gif|png|webp))\)|(https?:\/\/[^\s<]+?\.(?:jpg|jpeg|gif|png|webp)))(?:\s|$)/gi;

    const matches = Array.from(content.matchAll(imageUrlRegex));

    if (matches.length === 0) {
        return message;
    }

    const parts: (TextMessageContent | ImageMessageContent)[] = [];
    let lastIndex = 0;

    for (const match of matches) {
        // Add text before the image URL if any
        if (match.index! > lastIndex) {
            parts.push({
                type: "text",
                text: content.substring(lastIndex, match.index),
            });
        }

        // Extract the URL - it's either in group 1 (markdown syntax) or group 0 (direct URL)
        const imageUrl = (match[1] || match[0]).trim();

        parts.push({
            type: "image",
            source: {
                type: "url",
                data: imageUrl,
            },
        });

        lastIndex = match.index! + match[0].length;
    }

    // Add remaining text if any
    if (lastIndex < content.length) {
        parts.push({
            type: "text",
            text: content.substring(lastIndex),
        });
    }

    return { ...message, content: parts };
};

export default class ChatInterface {
    private _editor: Editor;
    public view: MarkdownView;
    public stopStreaming = false;
    public userScrolling = false;

    public settings: CerebroSettings;
    public editorPosition: EditorPosition;

    // UI elements

    constructor(settings: CerebroSettings, view: MarkdownView) {
        this.settings = settings;
        this.view = view;
        this._editor = view.editor;
        this.initScrollTracking();
    }

    public showInterface() {
	}

    private initScrollTracking(): void {
        const cm6editor = this._editor as EditorWithCM6;
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
        const rawEditorVal = this._editor.getValue();
        const bodyWithoutYML = removeYMLFromMessage(rawEditorVal);
        const messages = splitMessages(bodyWithoutYML)
            .map((message) => removeCommentsFromMessages(message))
            .map((message) => extractRoleAndMessage(message, this.settings))
            .map((message) => parseMessageForUrls(message));

        const processedFiles = new Set<string>();
        const messagesWithFiles = await Promise.all(
            messages.map((message) => this.parseFilesFromMessage(app, message, 1, processedFiles)),
        );
        console.log("messages", messagesWithFiles);
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
        const newLine = `\n<hr class="${CSSAssets.HR}">\n${userHeader(this.settings.userName, this.settings.headingLevel)}\n`;
        this._editor.replaceRange(newLine, this._editor.getCursor());

        // Move cursor to end of file
        const cursor = this._editor.getCursor();
        const newCursor = {
            line: cursor.line,
            ch: cursor.ch + newLine.length,
        };
        this._editor.setCursor(newCursor);
    }

    public completeUserResponse(): void {
        /**
         * 1. Moves cursor to end of line
         * 2. Places divider
         * 3. Completes the user's response by placing the assistant's header
         */
        this.moveCursorToEndOfFile(this._editor);
        const newLine = `\n\n<hr class="${CSSAssets.HR}">\n${assistantHeader(this.settings.assistantName, this.settings.headingLevel)}\n`;

        const cm6editor = this._editor as EditorWithCM6;
        const cursor = this._editor.getCursor();
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
        const newLine = `\n\n<hr class="${CSSAssets.HR}">\n${userHeader(this.settings.userName, this.settings.headingLevel)}\n`;
        const cm6editor = this._editor as EditorWithCM6;
        const cursor = this._editor.getCursor();
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
        this._editor.replaceRange(message, this._editor.getCursor());
        this.editorPosition = this.moveCursorToEndOfLine(this._editor, message);
    }

    public moveCursorToEndOfFile(editor: Editor): EditorPosition {
        try {
            const cm6editor = editor as EditorWithCM6;
            const lastPos = cm6editor.cm.state.doc.length;

            cm6editor.cm.dispatch({
                selection: {
                    anchor: lastPos,
                    head: lastPos,
                },
                scrollIntoView: false,
            });

            // Return cursor position in editor coordinates
            const lastLine = editor.lastLine();
            const lastLineContent = editor.getLine(lastLine);
            return {
                line: lastLine,
                ch: lastLineContent.length,
            };
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
            const noteFile = app.workspace.getActiveFile();

            if (!noteFile) {
                throw new Error("No active file");
            }
            const metaMatter = app.metadataCache.getFileCache(noteFile)?.frontmatter;

            // Get basic properties
            const title = metaMatter?.title || this.view.file?.basename;
            const tags = metaMatter?.tags || [];

            // Get system commands/instructions
            const system = [
                ...getCerebroBaseSystemPrompts(this.settings),
                ...(metaMatter?.system || []),
            ].filter((cmd) => cmd); // Filter out empty values

            // Create basic frontmatter object with required properties
            const frontmatter: ChatFrontmatter = {
                title,
                tags,
                system,
            };

            // Add model generation parameters if they exist in the frontmatter
            if (metaMatter?.model !== undefined) {
                frontmatter.model = metaMatter.model;
            }
            if (metaMatter?.stream !== undefined) {
                frontmatter.stream = metaMatter.stream;
            }
            if (metaMatter?.temperature !== undefined) {
                frontmatter.temperature = metaMatter.temperature;
            }
            if (metaMatter?.topP !== undefined) {
                frontmatter.topP = metaMatter.topP;
            }
            if (metaMatter?.topK !== undefined) {
                frontmatter.topK = metaMatter.topK;
            }
            if (metaMatter?.maxTokens !== undefined) {
                frontmatter.maxTokens = metaMatter.maxTokens;
            }
            if (metaMatter?.presencePenalty !== undefined) {
                frontmatter.presencePenalty = metaMatter.presencePenalty;
            }
            if (metaMatter?.frequencyPenalty !== undefined) {
                frontmatter.frequencyPenalty = metaMatter.frequencyPenalty;
            }
            if (metaMatter?.seed !== undefined) {
                frontmatter.seed = metaMatter.seed;
            }

            return frontmatter;
        } catch (err) {
            throw new Error("Error getting frontmatter");
        }
    }

    public addStreamedChunk(chunkText: string): ShouldContinue {
        if (this.stopStreaming) {
            logger.info("Stopping stream...");
            return false;
        }
        const cm6editor = this._editor as EditorWithCM6;
        const cursor = this._editor.getCursor();
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
        const cm6editor = this._editor as EditorWithCM6;
        const endCursor = this._editor.getCursor();
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
        if (depth > MAX_DOCUMENT_DEPTH) {
            return message;
        }

        const fileRegex = /(?<!`[^`]*)\[\[(.*?)(?:\|.*?)?\]\](?![^`]*`)/g;
        const contents: (TextMessageContent | ImageMessageContent | DocumentMessageContent)[] = [];
        const documentRelations = new Map<string, Set<string>>();

        // Process the original message first
        const contentToProcess = Array.isArray(message.content)
            ? message.content
                  .filter((c) => c.type === "text")
                  .map((c) => (c as TextMessageContent).text)
                  .join("\n")
            : (message.content as string);

        // Add the original text as first content block
        contents.push({
            type: "text",
            text: contentToProcess.replace(/\[\[.*?\]\]/g, "").trim(), // Remove wiki-links
        });

        // Find and process all files
        const filesMatches = contentToProcess.match(fileRegex);
        if (filesMatches) {
            for (const match of filesMatches) {
                const filePath = match.replace(/\[\[|\]\]/g, "").split("|")[0];
                const file = app.metadataCache.getFirstLinkpathDest(filePath, "");

                if (processedFiles.has(filePath) || !file || !(file instanceof TFile)) {
                    continue;
                }
                processedFiles.add(filePath);

                // Add document header
                contents.push({
                    type: "text",
                    text: `[${filePath}]\n`,
                });

                if (isValidImageExtension(file.extension)) {
                    contents.push({
                        type: "image",
                        source: await this.getImageSourceFromFile(app, file),
                        originalPath: filePath,
                    });
                } else if (isValidPDFExtension(file.extension)) {
                    contents.push({
                        type: "document",
                        source: await this.getPDFSourceFromFile(app, file),
                        originalPath: filePath,
                    });
                } else if (isValidFileExtension(file.extension)) {
                    const fileContent = await app.vault.cachedRead(file);
                    const contentWithoutYAML = removeYMLFromMessage(fileContent);

                    // Add the file content
                    contents.push({
                        type: "text",
                        text: contentWithoutYAML,
                        originalPath: filePath,
                    });

                    // Process nested files
                    const nestedMatches = contentWithoutYAML.match(fileRegex);
                    if (nestedMatches && depth < MAX_DOCUMENT_DEPTH) {
                        documentRelations.set(filePath, new Set());
                        for (const nestedMatch of nestedMatches) {
                            const nestedPath = nestedMatch.replace(/\[\[|\]\]/g, "").split("|")[0];
                            documentRelations.get(filePath)?.add(nestedPath);

                            // Recursively process nested file
                            if (!processedFiles.has(nestedPath)) {
                                const nestedFile = app.metadataCache.getFirstLinkpathDest(
                                    nestedPath,
                                    "",
                                );
                                if (nestedFile && nestedFile instanceof TFile) {
                                    await this.processFile(
                                        app,
                                        nestedFile,
                                        nestedPath,
                                        depth + 1,
                                        processedFiles,
                                        contents,
                                    );
                                }
                            }
                        }
                    }
                }
            }

            // Add document relationships if there are any
            if (documentRelations.size > 0) {
                contents.push({
                    type: "text",
                    text:
                        "\nDocument relationships:\n" +
                        Array.from(documentRelations.entries())
                            .map(
                                ([path, refs]) =>
                                    `${path} → ${refs.size ? Array.from(refs).join(", ") : "(no embedded documents)"}`,
                            )
                            .join("\n"),
                });
            }
        }

        return {
            ...message,
            content: contents,
        };
    }
    private async processFile(
        app: App,
        file: TFile,
        filePath: string,
        depth: number,
        processedFiles: Set<string>,
        contents: (TextMessageContent | ImageMessageContent | DocumentMessageContent)[],
    ): Promise<void> {
        processedFiles.add(filePath);

        contents.push({
            type: "text",
            text: `[${filePath}]\n`,
        });

        if (isValidImageExtension(file.extension)) {
            contents.push({
                type: "image",
                source: await this.getImageSourceFromFile(app, file),
                originalPath: filePath,
            });
        } else if (isValidPDFExtension(file.extension)) {
            contents.push({
                type: "document",
                source: await this.getPDFSourceFromFile(app, file),
                originalPath: filePath,
            });
        } else if (isValidFileExtension(file.extension)) {
            const fileContent = await app.vault.cachedRead(file);
            const cleanContent = removeYMLFromMessage(fileContent).replace(/\[\[.*?\]\]/g, ""); // Remove wiki-links
            contents.push({
                type: "text",
                text: cleanContent,
                originalPath: filePath,
            });
        }
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
