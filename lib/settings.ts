import { Provider } from "./types";

export interface ProviderSettings {
    apiKey: string;
}

export interface CerebroSettings {
    providerSettings: Record<Provider, ProviderSettings>;
    userName: string;
    assistantName: string;
    chatTemplateFolder: string;
    chatFolder: string;
    autoInferTitle: boolean;
    dateFormat: string;
    headingLevel: number;
    inferTitleLanguage: string;

    defaultModel: string;
    defaultStream: boolean;
    defaultTemperature: number;
    defaultMaxTokens: number;
    defaultSystemPrompt: string;

    modelPropertyName: string;
    advancedMode: boolean;
}

export const DEFAULT_SETTINGS: CerebroSettings = {
    providerSettings: {
        OpenAI: {
            apiKey: "default",
        },
        Anthropic: {
            apiKey: "default",
        },
        Google: {
            apiKey: "default",
        },
        DeepSeek: {
            apiKey: "default",
        },
        XAI: {
            apiKey: "default",
        },
    },
    userName: "User",
    assistantName: "Cerebro",
    chatTemplateFolder: "Cerebro/Templates",
    chatFolder: "Cerebro/Chats",
    autoInferTitle: true,
    dateFormat: "YYYY-MM-DD-hhmmss",
    headingLevel: 3,
    inferTitleLanguage: "English",

    defaultModel: "openai:gpt-4o-mini",
    defaultStream: true,
    defaultTemperature: 0.7,
    defaultMaxTokens: 1024,
    defaultSystemPrompt: "I am a helpful assistant.",
    modelPropertyName: "llm_model",

    advancedMode: false,
};

export const getFrontmatter = (settings: CerebroSettings): string => {
    // return settings.llmSettings[settings.defaultLLM];
    return "---\nsystem_commands: ['I am a helpful assistant.']\ntemperature: 0\ntop_p: 1\nmax_tokens: 1024\npresence_penalty: 1\nfrequency_penalty: 1\nstream: true\nstop: null\nn: 1\nmodel: gpt-3.5-turbo\nllm: OpenAI\n---";
};
