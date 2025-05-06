import ModelManager from "./modelManager";
import type { ModelConfig, Provider } from "./types";

export interface ProviderSettings {
    apiKey: string;
}

export interface CerebroSettings {
    providers: Record<Provider, ProviderSettings>;
    userName: string;
    assistantName: string;
    chatTemplateFolder: string;
    chatFolder: string;
    autoInferTitle: boolean;
    dateFormat: string;
    inferTitleLanguage: string;
    modelDefaults: {
        model: ModelConfig;
        temperature: number;
        maxTokens: number;
        overlayMaxTokens: number;
        system: string[];
        overlaySystem: string[];
    };
}

export const getDefaultSettings = (modelManager: ModelManager): CerebroSettings => {
    return {
        providers: {
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
        inferTitleLanguage: "English",
        modelDefaults: {
            model: modelManager.defaultModel,
            temperature: 0.7,
            maxTokens: 1024,
            overlayMaxTokens: 256,
            system: ["You are a helpful assistant."],
            overlaySystem: ["You are a helpful assistant. You're also very concise."],
        },
    };
};
