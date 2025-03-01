import { Editor } from "obsidian";
import { Message } from "src/Models/Message";
import { ChatGPT_MDSettings } from "src/Models/Config";
import { FileService } from "./FileService";
import { NotificationService } from "./NotificationService";
import {
  HORIZONTAL_LINE_MD,
  MARKDOWN_LINKS_REGEX,
  NEWLINE,
  ROLE_ASSISTANT,
  ROLE_IDENTIFIER,
  ROLE_USER,
  WIKI_LINKS_REGEX,
  YAML_FRONTMATTER_REGEX,
} from "src/Constants";

/**
 * Service responsible for all message-related operations
 * This consolidates functionality previously spread across multiple files
 */
export class MessageService {
  constructor(
    private fileService: FileService,
    private notificationService: NotificationService
  ) {}

  /**
   * Find links in a message
   */
  findLinksInMessage(message: string): { link: string; title: string }[] {
    const regexes = [
      { regex: WIKI_LINKS_REGEX, fullMatchIndex: 0, titleIndex: 1 },
      { regex: MARKDOWN_LINKS_REGEX, fullMatchIndex: 0, titleIndex: 2 },
    ];

    const links: { link: string; title: string }[] = [];
    const seenTitles = new Set<string>();

    for (const { regex, fullMatchIndex, titleIndex } of regexes) {
      for (const match of message.matchAll(regex)) {
        const fullLink = match[fullMatchIndex];
        const linkTitle = match[titleIndex];

        if (linkTitle && !seenTitles.has(linkTitle)) {
          links.push({ link: fullLink, title: linkTitle });
          seenTitles.add(linkTitle);
        }
      }
    }

    return links;
  }

  /**
   * Split text into messages based on horizontal line separator
   */
  splitMessages(text: string | undefined): string[] {
    return text ? text.split(HORIZONTAL_LINE_MD) : [];
  }

  /**
   * Remove YAML frontmatter from text
   */
  removeYAMLFrontMatter(note: string | undefined): string | undefined {
    return note ? note.replace(YAML_FRONTMATTER_REGEX, "").trim() : note;
  }

  /**
   * Remove comments from messages
   */
  removeCommentsFromMessages(message: string): string {
    try {
      const commentBlock = /=begin-chatgpt-md-comment[\s\S]*?=end-chatgpt-md-comment/g;
      return message.replace(commentBlock, "");
    } catch (err) {
      this.notificationService.showError("Error removing comments from messages: " + err);
      return message;
    }
  }

  /**
   * Extract role and content from a message
   */
  extractRoleAndMessage(message: string): Message {
    try {
      if (!message.includes(ROLE_IDENTIFIER)) {
        return {
          role: ROLE_USER,
          content: message,
        };
      }

      const [roleSection, ...contentSections] = message.split(ROLE_IDENTIFIER)[1].split("\n");
      const cleanedRole = this.cleanupRole(roleSection);

      return {
        role: cleanedRole,
        content: contentSections.join("\n").trim(),
      };
    } catch (error) {
      this.notificationService.showError("Failed to extract role and message: " + error);
      return {
        role: ROLE_USER,
        content: message,
      };
    }
  }

  /**
   * Clean up role string to standardized format
   */
  private cleanupRole(role: string): string {
    const trimmedRole = role.trim().toLowerCase();
    const roles = [ROLE_USER, ROLE_ASSISTANT];
    const foundRole = roles.find((r) => trimmedRole.includes(r));

    if (foundRole) {
      return foundRole;
    }

    this.notificationService.showWarning(`Unknown role: "${role}", defaulting to user`);
    return ROLE_USER;
  }

  /**
   * Clean messages from the editor content
   */
  cleanMessagesFromNote(editor: Editor): string[] {
    const messages = this.splitMessages(this.removeYAMLFrontMatter(editor.getValue()));
    return messages.map((msg) => this.removeCommentsFromMessages(msg));
  }

  /**
   * Get messages from the editor
   */
  async getMessagesFromEditor(
    editor: Editor,
    settings: ChatGPT_MDSettings
  ): Promise<{
    messages: string[];
    messagesWithRole: Message[];
  }> {
    let messages = this.cleanMessagesFromNote(editor);

    messages = await Promise.all(
      messages.map(async (message) => {
        const links = this.findLinksInMessage(message);
        for (const link of links) {
          try {
            let content = await this.fileService.getLinkedNoteContent(link.title);

            if (content) {
              // remove the assistant and user delimiters
              // if the inlined note was already a chat
              const regex = new RegExp(
                `${NEWLINE}${HORIZONTAL_LINE_MD}${NEWLINE}#+ ${ROLE_IDENTIFIER}(?:${ROLE_USER}|${ROLE_ASSISTANT}).*$`,
                "gm"
              );
              content = content?.replace(regex, "").replace(YAML_FRONTMATTER_REGEX, "");

              message = message.replace(
                new RegExp(this.escapeRegExp(link.link), "g"),
                `${NEWLINE}${link.title}${NEWLINE}${content}${NEWLINE}`
              );
            } else {
              console.warn(`Error fetching linked note content for: ${link.link}`);
            }
          } catch (error) {
            console.error(error);
          }
        }

        return message;
      })
    );

    // Extract roles from each message
    const messagesWithRole = messages.map((msg) => this.extractRoleAndMessage(msg));

    return { messages, messagesWithRole };
  }

  /**
   * Add system commands to messages
   */
  addSystemCommandsToMessages(messagesWithRole: Message[], systemCommands: string[] | null): Message[] {
    if (!systemCommands || systemCommands.length === 0) {
      return messagesWithRole;
    }

    // Add system commands to the beginning of the list
    const systemMessages = systemCommands.map((command) => ({
      role: "system",
      content: command,
    }));

    return [...systemMessages, ...messagesWithRole];
  }

  /**
   * Get a header role string
   */
  getHeaderRole(headingPrefix: string, role: string, model?: string): string {
    return `${NEWLINE}${HORIZONTAL_LINE_MD}${NEWLINE}${headingPrefix}${ROLE_IDENTIFIER}${role}${
      model ? `<span style="font-size: small;"> (${model})</span>` : ``
    }${NEWLINE}`;
  }

  /**
   * Get heading prefix for a given heading level
   */
  getHeadingPrefix(headingLevel: number): string {
    if (headingLevel === 0) {
      return "";
    } else if (headingLevel > 6) {
      return "#".repeat(6) + " ";
    }
    return "#".repeat(headingLevel) + " ";
  }

  /**
   * Check if a code block is unfinished
   */
  unfinishedCodeBlock(text: string): boolean {
    const codeBlockMatches = text.match(/```/g);
    return codeBlockMatches !== null && codeBlockMatches.length % 2 !== 0;
  }

  /**
   * Format a message for display
   */
  formatMessage(message: Message, headingLevel: number, model?: string): string {
    const headingPrefix = this.getHeadingPrefix(headingLevel);
    const roleHeader = this.getHeaderRole(headingPrefix, message.role, model);
    return `${roleHeader}${message.content}`;
  }

  /**
   * Append a message to the editor
   */
  appendMessage(editor: Editor, message: string, headingLevel: number): void {
    const headingPrefix = this.getHeadingPrefix(headingLevel);
    const assistantRoleHeader = this.getHeaderRole(headingPrefix, ROLE_ASSISTANT);
    const userRoleHeader = this.getHeaderRole(headingPrefix, ROLE_USER);

    editor.replaceRange(`${assistantRoleHeader}${message}${userRoleHeader}`, editor.getCursor());
  }

  /**
   * Process an AI response and update the editor
   */
  processResponse(editor: Editor, response: any, settings: ChatGPT_MDSettings): void {
    if (response.mode === "streaming") {
      this.processStreamingResponse(editor, settings);
    } else {
      this.processStandardResponse(editor, response, settings);
    }
  }

  /**
   * Process a streaming response
   */
  private processStreamingResponse(editor: Editor, settings: ChatGPT_MDSettings): void {
    const headingPrefix = this.getHeadingPrefix(settings.headingLevel);
    const newLine = this.getHeaderRole(headingPrefix, ROLE_USER);
    editor.replaceRange(newLine, editor.getCursor());

    // move cursor to end of completion
    const cursor = editor.getCursor();
    const newCursor = {
      line: cursor.line,
      ch: cursor.ch + newLine.length,
    };
    editor.setCursor(newCursor);
  }

  /**
   * Process a standard (non-streaming) response
   */
  private processStandardResponse(editor: Editor, response: string, settings: ChatGPT_MDSettings): void {
    let responseStr = response;
    if (this.unfinishedCodeBlock(responseStr)) {
      responseStr = responseStr + "\n```";
    }

    this.appendMessage(editor, responseStr, settings.headingLevel);
  }

  /**
   * Escape special characters in a string for use in a regular expression
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
