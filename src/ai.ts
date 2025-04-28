import * as anthropic from "@ai-sdk/anthropic";
import * as deepseek from "@ai-sdk/deepseek";
import * as google from "@ai-sdk/google";
import * as openai from "@ai-sdk/openai";
import * as xai from "@ai-sdk/xai";
import { createProviderRegistry, generateText, type Provider, streamText } from "ai";
import { CerebroMessages } from "./constants";
import { getTextOnlyContent, modelToKey } from "./helpers";
import { logger } from "./logger";
import { type CerebroSettings } from "./settings";
import type { ChatFrontmatter, ChatProperty, Message, ModelConfig } from "./types";

// Define mapping between ChatFrontmatter properties and their default values in CerebroSettings
interface DefaultsMapping {
    frontmatterKey: keyof ChatFrontmatter & keyof ChatProperty;
    settingsKey: keyof CerebroSettings;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
    { name: "gpt-4o-mini", provider: "openai" },
    { name: "gpt-4o", provider: "openai" },
    { name: "o1", provider: "openai" },
    { name: "o1-mini", provider: "openai" },
    { name: "o3-mini", provider: "openai" },
    { alias: "claude-3-7", name: "claude-3-7-sonnet-20250219", provider: "anthropic" },
    { alias: "claude-3-5-sonnet", name: "claude-3-5-sonnet-20241022", provider: "anthropic" },
    { alias: "claude-3-5-haiku", name: "claude-3-5-haiku-20241022", provider: "anthropic" },
];

export const MODEL_PROPERTY_NAME = "model";

export const PROPERTY_MAPPINGS: DefaultsMapping[] = [
    { frontmatterKey: MODEL_PROPERTY_NAME, settingsKey: "defaultModel" },
    { frontmatterKey: "maxTokens", settingsKey: "defaultMaxTokens" },
    { frontmatterKey: "temperature", settingsKey: "defaultTemperature" },
    { frontmatterKey: "system", settingsKey: "defaultSystemPrompt" },
];

export class AI {
    private providerRegistry: Provider;

    constructor(settings: CerebroSettings) {
        this.providerRegistry = this.initialiseProviderRegistry(settings);
    }

    private initialiseProviderRegistry(settings: CerebroSettings): Provider {
        type ProviderConfigs = Parameters<typeof createProviderRegistry>[0];

        const providerConfig: ProviderConfigs = {};

        if (settings.providerSettings.OpenAI.apiKey) {
            providerConfig.openai = openai.createOpenAI({
                apiKey: settings.providerSettings.OpenAI.apiKey,
            });
        }

        if (settings.providerSettings.Anthropic.apiKey) {
            providerConfig.anthropic = anthropic.createAnthropic({
                apiKey: settings.providerSettings?.Anthropic?.apiKey,
                headers: { "anthropic-dangerous-direct-browser-access": "true" },
            });
        }

        if (settings.providerSettings.Google.apiKey) {
            providerConfig.google = google.createGoogleGenerativeAI({
                apiKey: settings.providerSettings?.Google?.apiKey,
            });
        }

        if (settings.providerSettings.DeepSeek.apiKey) {
            providerConfig.deepseek = deepseek.createDeepSeek({
                apiKey: settings.providerSettings.DeepSeek.apiKey,
            });
        }

        if (settings.providerSettings.XAI.apiKey) {
            providerConfig.xai = xai.createXai({
                apiKey: settings.providerSettings.XAI.apiKey,
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
        chatProperties: ChatProperty,
        settings: CerebroSettings,
    ): ChatProperty {
        // Create a new ChatFrontmatter object with the original properties
        const finalChatParams: ChatProperty = {
            ...chatProperties,
        };

        // Apply all defaults from the settings object
        PROPERTY_MAPPINGS.forEach((mapping) => {
            const { frontmatterKey, settingsKey } = mapping;

            // Only apply default if the property is undefined in the frontmatter
            if (
                finalChatParams[frontmatterKey] === undefined &&
                settings[settingsKey] !== undefined
            ) {
                // This cast is necessary because TypeScript can't infer the relationship
                // between the two different key types
                (finalChatParams as any)[frontmatterKey] = settings[settingsKey];
            }
        });

        return finalChatParams;
    }

    public async chat(
        messages: Message[],
        properties: ChatProperty,
        settings: CerebroSettings,
        onChunk?: (chunk: string) => void,
    ): Promise<Message> {
        const formattedMessages = this.formatMessagesForProvider(messages);
        let responseStr: string;
        const callSettings = this.resolveChatParameters(properties, settings);

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
        callSettings: ChatProperty,
        onChunk?: (chunk: string) => void,
    ): Promise<{
        fullResponse: string;
        finishReason: string | null | undefined;
    }> {
        if (!callSettings.model) {
            throw new Error("Model not found");
        }

        let fullResponse = "";
        const finishReason: string | null | undefined = null;

        try {
            const model = this.providerRegistry.languageModel(modelToKey(callSettings.model));

            const { textStream } = streamText({
                model,
                messages,
                temperature: callSettings.temperature,
                maxTokens: callSettings.maxTokens,
                system: callSettings.system?.join(""),
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
        } catch (error) {
            console.error("Error in streamResponse_v2:", error);
            throw error;
        }
    }

    public async inferTitle(
        messages: Message[],
        inferTitleLanguage: string,
        chatProperties: ChatProperty,
        settings: CerebroSettings,
    ): Promise<string> {
        const sanitizeTitle = (title: string): string => {
            return title
                .replace(/[:/\\]/g, "")
                .replace("Title", "")
                .replace("title", "")
                .trim();
        };

        const callSettings = this.resolveChatParameters(chatProperties, settings);

        if (!callSettings.model) {
            throw new Error("Model not found");
        }

        const model = this.providerRegistry.languageModel(modelToKey(callSettings.model));
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
function originalAnthropic(arg0: string): any {
    throw new Error("Function not implemented.");
}
