import { marked } from "marked";
import { logger } from "@/logger";
import type { Message, MessageContent } from "@/types";

// Centralized message format configuration
export const MESSAGE_FORMAT = {
    HEADING_LEVEL: 6, // h6 headers (###### in markdown)
    PREFIX: "cerebro:",
    USER_ROLE: "user",
    ASSISTANT_ROLE: "assistant",

    // Helper functions to generate consistent formats
    getUserHeader: (): string =>
        `${"#".repeat(MESSAGE_FORMAT.HEADING_LEVEL)} ${MESSAGE_FORMAT.PREFIX}${MESSAGE_FORMAT.USER_ROLE}`,

    getAssistantHeader: (): string =>
        `${"#".repeat(MESSAGE_FORMAT.HEADING_LEVEL)} ${MESSAGE_FORMAT.PREFIX}${MESSAGE_FORMAT.ASSISTANT_ROLE}`,

    getHeaderForRole: (role: string): string =>
        role === MESSAGE_FORMAT.USER_ROLE
            ? MESSAGE_FORMAT.getUserHeader()
            : MESSAGE_FORMAT.getAssistantHeader(),

    getRoleFromHeader: (header: string): string | null => {
        const match = header.match(
            new RegExp(
                `${MESSAGE_FORMAT.PREFIX}(${MESSAGE_FORMAT.USER_ROLE}|${MESSAGE_FORMAT.ASSISTANT_ROLE})`,
            ),
        );
        return match ? match[1] : null;
    },
};

interface ParsedMessage {
    role: string;
    content: string;
}

/**
 * Parses conversation content from markdown using marked
 * @param markdown Markdown content to parse
 * @returns Array of parsed messages
 */
export const parseConversationMarkdown = (markdown: string): ParsedMessage[] => {
    try {
        const tokens = marked.lexer(markdown);
        const messages: ParsedMessage[] = [];
        let currentRole: string | null = null;
        let currentContent: string[] = [];

        for (const token of tokens) {
            // Check for headers with cerebro user/assistant tags
            if (token.type === "heading" && token.depth === MESSAGE_FORMAT.HEADING_LEVEL) {
                // If we have a current message, add it to the messages array
                if (currentRole && currentContent.length > 0) {
                    messages.push({
                        role: currentRole,
                        content: currentContent.join("\n").trim(),
                    });
                    currentContent = [];
                }

                // Check if this is a cerebro user or assistant tag
                const role = MESSAGE_FORMAT.getRoleFromHeader(token.text);
                currentRole = role;
            }
            // If we have a current role, add content to the current message
            else if (currentRole && token.raw) {
                currentContent.push(token.raw);
            }
        }

        // Add the last message if there is one
        if (currentRole && currentContent.length > 0) {
            messages.push({
                role: currentRole,
                content: currentContent.join("\n").trim(),
            });
        }

        return messages;
    } catch (error) {
        logger.error(`[Cerebro] Error parsing markdown: ${error}`);
        return [];
    }
};

/**
 * Serializes messages to markdown
 * @param messages Array of messages to serialize
 * @returns Markdown string
 */
export const serializeMessagesToMarkdown = (messages: Message[]): string => {
    if (messages.length === 0) {
        return "";
    }

    return messages
        .map((message) => {
            const headerLine = MESSAGE_FORMAT.getHeaderForRole(message.role);

            // Convert message content to markdown text
            let messageText = "";
            if (typeof message.content === "string") {
                messageText = message.content;
            } else if (Array.isArray(message.content)) {
                // Handle content arrays (text, images, documents)
                for (const part of message.content) {
                    if (part.type === "text") {
                        messageText += part.text;
                    } else if (part.type === "image") {
                        // Add a reference to the image
                        messageText += `\n![Image](${part.originalPath || "image"})\n`;
                    } else if (part.type === "document") {
                        // Add a reference to the document
                        messageText += `\n[Document](${part.originalPath || "document"})\n`;
                    }
                }
            }

            return `${headerLine}\n${messageText}\n`;
        })
        .join("");
};

/**
 * Convert parsed message content to MessageContent format
 * For now, we just treat everything as string content,
 * but this could be enhanced to detect embedded images etc.
 */
export const convertToMessageContent = (content: string): MessageContent => {
    return content;
};
