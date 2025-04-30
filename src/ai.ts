import * as anthropic from "@ai-sdk/anthropic";
import * as deepseek from "@ai-sdk/deepseek";
import * as google from "@ai-sdk/google";
import * as openai from "@ai-sdk/openai";
import * as xai from "@ai-sdk/xai";
import { APICallError, createProviderRegistry, generateText, type Provider, streamText } from "ai";
import { Notice } from "obsidian";
import { CerebroMessages } from "./constants";
import { getTextOnlyContent } from "./helpers";
import { logger } from "./logger";
import ModelManager from "./modelManager";
import { type CerebroSettings } from "./settings";
import type { ChatFrontmatter, ConversationParameters, Message } from "./types";

// Define mapping between ChatFrontmatter properties and their default values in CerebroSettings
interface DefaultsMapping {
    frontmatterKey: keyof ChatFrontmatter & keyof ConversationParameters;
    settingsKey: keyof CerebroSettings;
}

export const MODEL_PROPERTY_NAME = "model";

export class AI {
    private providerRegistry: Provider;
    private modelManager: ModelManager;

    constructor(settings: CerebroSettings) {
        this.providerRegistry = this.initialiseProviderRegistry(settings);
        this.modelManager = ModelManager.getInstance();
    }

    private initialiseProviderRegistry(settings: CerebroSettings): Provider {
        type ProviderConfigs = Parameters<typeof createProviderRegistry>[0];

        const providerConfig: ProviderConfigs = {};

        if (settings.providers.OpenAI.apiKey) {
            providerConfig.openai = openai.createOpenAI({
                apiKey: settings.providers.OpenAI.apiKey,
            });
        }

        if (settings.providers.Anthropic.apiKey) {
            providerConfig.anthropic = anthropic.createAnthropic({
                apiKey: settings.providers?.Anthropic?.apiKey,
                headers: { "anthropic-dangerous-direct-browser-access": "true" },
            });
        }

        if (settings.providers.Google.apiKey) {
            providerConfig.google = google.createGoogleGenerativeAI({
                apiKey: settings.providers?.Google?.apiKey,
            });
        }

        if (settings.providers.DeepSeek.apiKey) {
            providerConfig.deepseek = deepseek.createDeepSeek({
                apiKey: settings.providers.DeepSeek.apiKey,
            });
        }

        if (settings.providers.XAI.apiKey) {
            providerConfig.xai = xai.createXai({
                apiKey: settings.providers.XAI.apiKey,
            });
        }

        return createProviderRegistry(providerConfig);
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

            const messageContents = Array.isArray(msg.content)
                ? msg.content.map((item) => {
                      if (item.type === "text") {
                          return { type: "text", text: item.text };
                      } else if (item.type === "image") {
                          return {
                              type: "image",
                              image: item.source.data,
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
                : JSON.stringify(msg.content);

            return {
                role: msg.role,
                content: messageContents,
            };
        });
    }

    private resolveChatParameters(
        convoParams: ConversationParameters,
        settings: CerebroSettings,
    ): ConversationParameters {
        // Create a new ChatFrontmatter object with the original properties
        const finalChatParams: ConversationParameters = {
            ...convoParams,
        };

        for (const [key, value] of Object.entries(settings.modelDefaults)) {
            // Only apply default if the property is undefined in the chat parameters
            if (finalChatParams[key as keyof ConversationParameters] === undefined) {
                (finalChatParams as Record<string, unknown>)[key] = value;
            }
        }
        return finalChatParams;
    }

    public async chat(
        messages: Message[],
        convoParams: ConversationParameters,
        settings: CerebroSettings,
        onChunk?: (chunk: string) => void,
    ): Promise<Message> {
        const formattedMessages = this.formatMessagesForProvider(messages);
        let responseStr: string;
        const callSettings = this.resolveChatParameters(convoParams, settings);

        const { fullResponse, finishReason } = await this.streamResponse(
            formattedMessages,
            callSettings,
            onChunk,
        );
        responseStr = fullResponse;
        logger.info("[Cerebro] Model finished streaming", { finish_reason: finishReason });

        return {
            role: "assistant",
            content: responseStr,
        };
    }

    private async streamResponse(
        messages: any[],
        { temperature, maxTokens, system, model: modelConfig }: ConversationParameters,
        onChunk?: (chunk: string) => void,
    ): Promise<{
        fullResponse: string;
        finishReason: string | null | undefined;
    }> {
        if (!modelConfig) {
            throw new Error("Model not found");
        }

        let fullResponse = "";
        const finishReason: string | null | undefined = null;

        const model = this.providerRegistry.languageModel(modelConfig.key);

        const { textStream } = streamText({
            model,
            messages,
            temperature,
            maxTokens,
            system: system?.join(""),
            onError: ({ error }) => {
                logger.error("Error while streaming", error);
                if (APICallError.isInstance(error)) {
                    new Notice(`API call failed. Please check console for more details.`);
                } else {
                    new Notice(`Error while streaming: ${error as string}`);
                }
            },
        });

        const reader = textStream.getReader();

        while (true) {
            const { done, value: chunkText } = await reader.read();
            if (done) {
                break;
            }
            fullResponse += chunkText;

            // Call the onChunk callback if provided
            if (onChunk) {
                onChunk(chunkText);
            }
        }

        return {
            fullResponse,
            finishReason,
        };
    }

    public async inferTitle(
        messages: Message[],
        inferTitleLanguage: string,
        convoParams: ConversationParameters,
        settings: CerebroSettings,
    ): Promise<string> {
        const sanitizeTitle = (title: string): string => {
            return title
                .replace(/[:/\\]/g, "")
                .replace("Title", "")
                .replace("title", "")
                .trim();
        };

        const callSettings = this.resolveChatParameters(convoParams, settings);

        if (!callSettings.model) {
            throw new Error("Model not found");
        }

        const model = this.providerRegistry.languageModel(callSettings.model.key);
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
