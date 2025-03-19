import { generateText, Provider, streamText } from "ai";
import ChatInterface from "lib/chatInterface";
import { CerebroMessages } from "lib/constants";
import { getTextOnlyContent, sanitizeTitle, unfinishedCodeBlock } from "lib/helpers";
import { logger } from "lib/logger";
import { CerebroSettings } from "lib/settings";
import { ChatFrontmatter, Message } from "lib/types";

const sanitizeTitle = (title: string): string => {
    return title
        .replace(/[:/\\]/g, "")
        .replace("Title", "")
        .replace("title", "")
        .trim();
};

export class AI {
    private providerRegistry: Provider;

    constructor(providerRegistry: Provider) {
        this.providerRegistry = providerRegistry;
    }

    private formatMessagesForProvider(messages: Message[]): any[] {
        return messages.map((msg) => {
            // If content is a string, return simple format
            if (typeof msg.content === "string") {
                return {
                    role: msg.role,
                    content: msg.content,
                };
            }

            // For complex content types (images, documents, etc.), format appropriately
            // This is a simplified version - we may need to adapt based on provider requirements
            return {
                role: msg.role,
                content: Array.isArray(msg.content)
                    ? msg.content.map((item) => {
                          if (item.type === "text") {
                              return { type: "text", text: item.text };
                          } else if (item.type === "image") {
                              return {
                                  type: "image",
                                  source: {
                                      type: "base64",
                                      media_type: item.source.media_type,
                                      data: item.source.data,
                                  },
                              };
                          } else if (item.type === "document") {
                              return {
                                  type: "document",
                                  source: {
                                      type: "base64",
                                      media_type: item.source.media_type,
                                      data: item.source.data,
                                  },
                              };
                          }
                          return { type: "text", text: JSON.stringify(item) };
                      })
                    : JSON.stringify(msg.content),
            };
        });
    }

    private resolveChatParameters(
        frontmatter: ChatFrontmatter,
        settings: CerebroSettings,
    ): ChatFrontmatter {
        // Create a new ChatFrontmatter object with the original properties
        const resolvedFrontmatter: ChatFrontmatter = {
            ...frontmatter,
        };

        // Define mapping between ChatFrontmatter properties and their default values in CerebroSettings
        interface DefaultsMapping {
            frontmatterKey: keyof ChatFrontmatter;
            settingsKey: keyof CerebroSettings;
        }

        // Map each ChatFrontmatter property to its corresponding default in CerebroSettings
        const propertyMappings: DefaultsMapping[] = [
            { frontmatterKey: "stream", settingsKey: "defaultStream" },
            { frontmatterKey: "model", settingsKey: "defaultModel" },
            { frontmatterKey: "maxTokens", settingsKey: "defaultMaxTokens" },
            { frontmatterKey: "temperature", settingsKey: "defaultTemperature" },
        ];

        // Apply all defaults from the settings object
        propertyMappings.forEach((mapping) => {
            const { frontmatterKey, settingsKey } = mapping;

            // Only apply default if the property is undefined in the frontmatter
            if (
                resolvedFrontmatter[frontmatterKey] === undefined &&
                settings[settingsKey] !== undefined
            ) {
                // This cast is necessary because TypeScript can't infer the relationship
                // between the two different key types
                (resolvedFrontmatter as any)[frontmatterKey] = settings[settingsKey];
            }
        });

        return resolvedFrontmatter;
    }

    public async chat(
        messages: Message[],
        frontmatter: ChatFrontmatter,
        settings: CerebroSettings,
        chatInterface: ChatInterface,
    ): Promise<Message> {
        const formattedMessages = this.formatMessagesForProvider(messages);
        let responseStr: string;
        const callSettings = this.resolveChatParameters(frontmatter, settings);

        // Handle streaming vs non-streaming
        if (callSettings.stream) {
            const { fullResponse, finishReason } = await this.streamResponse(
                formattedMessages,
                callSettings,
                chatInterface,
            );
            responseStr = fullResponse;
            logger.info("[Cerebro] Model finished generating", { finish_reason: finishReason });
        } else {
            const response = await this.generateNonStreaming(formattedMessages, callSettings);
            responseStr = response;

            if (unfinishedCodeBlock(responseStr)) {
                responseStr = responseStr + "\n```";
            }
            chatInterface.appendNonStreamingMessage(responseStr);
        }

        return {
            role: "assistant",
            content: responseStr,
        };
    }

    private async streamResponse(
        messages: any[],
        callSettings: ChatFrontmatter,
        chatInterface: ChatInterface,
    ): Promise<{
        fullResponse: string;
        finishReason: string | null | undefined;
    }> {
        if (!callSettings.model) {
            throw new Error("Model not found");
        }
        let fullResponse = "";
        const finishReason: string | null | undefined = null;

        // Save initial cursor position
        const initialCursor = chatInterface.editorPosition;
        const model = this.providerRegistry.languageModel(callSettings.model);

        const result = streamText({
            model,
            messages,
            temperature: callSettings.temperature,
            maxTokens: callSettings.maxTokens,
        });

        const reader = result.textStream.getReader();
        while (true) {
            const { done, value: chunkText } = await reader.read();
            if (done) {
                break;
            }
            fullResponse += chunkText;
            chatInterface.addStreamedChunk(chunkText);
        }

        // Clean up unfinished code blocks
        if (unfinishedCodeBlock(fullResponse)) {
            fullResponse += "\n```";
        }

        chatInterface.finalizeStreamedResponse(fullResponse, initialCursor);

        return {
            fullResponse,
            finishReason,
        };
    }

    private async generateNonStreaming(
        messages: any[],
        callSettings: ChatFrontmatter,
    ): Promise<string> {
        if (!callSettings.model) {
            throw new Error("Model not found");
        }
        const model = this.providerRegistry.languageModel(callSettings.model);
        const response = await generateText({
            model,
            messages,
            temperature: callSettings.temperature,
            maxTokens: callSettings.maxTokens,
        });

        return response.text;
    }

    public async inferTitle(
        messages: Message[],
        inferTitleLanguage: string,
        frontmatter: ChatFrontmatter,
        settings: CerebroSettings,
    ): Promise<string> {
        const callSettings = this.resolveChatParameters(frontmatter, settings);

        if (!callSettings.model) {
            throw new Error("Model not found");
        }

        const model = this.providerRegistry.languageModel(callSettings.model);
        const textMessages = getTextOnlyContent(messages);
        const textJson = JSON.stringify(textMessages);
        const INFER_TITLE_PROMPT = `Infer title from the summary of the content of these messages. The title **cannot** contain any of the following characters: colon, back slash or forward slash. Just return the title. Write the title in ${inferTitleLanguage}. \nMessages:\n\n${textJson}`;
        const response = await generateText({
            model,
            messages: [
                {
                    role: "user",
                    content: INFER_TITLE_PROMPT,
                },
            ],
            temperature: 0,
            maxTokens: 50,
        });

        const title = response.text;
        if (!title) {
            throw new Error(CerebroMessages.INFER_TITLE_UNKNOWN_FAILURE);
        }
        return sanitizeTitle(title);
    }
}
