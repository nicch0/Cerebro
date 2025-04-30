import type { ModelConfig, ModelConfigInput } from "./types";

export default class ModelManager {
    private static instance: ModelManager;
    private keyToModelMap: Map<string, ModelConfig> = new Map();
    public readonly availableModels: ModelConfig[];
    public readonly defaultModel: ModelConfig;

    // Helper method to create a model with computed key
    private createModel(config: ModelConfigInput): ModelConfig {
        const model = {
            ...config,
            get key(): string {
                return `${this.provider}:${this.name}`;
            },
        };
        return model;
    }

    private constructor() {
        // Define models using the factory method
        this.availableModels = [
            this.createModel({
                displayName: "GPT-4o-mini",
                name: "gpt-4o-mini",
                provider: "openai",
            }),
            this.createModel({
                displayName: "GPT-4o",
                name: "gpt-4o",
                provider: "openai",
            }),
            this.createModel({
                displayName: "o1",
                name: "o1",
                provider: "openai",
            }),
            this.createModel({
                displayName: "o1-mini",
                name: "o1-mini",
                provider: "openai",
            }),
            this.createModel({
                displayName: "o3",
                name: "o3",
                provider: "openai",
            }),
            this.createModel({
                displayName: "o3-mini",
                name: "o3-mini",
                provider: "openai",
            }),
            this.createModel({
                displayName: "Claude 3.7 Sonnet",
                alias: "claude-3-7",
                name: "claude-3-7-sonnet-20250219",
                provider: "anthropic",
            }),
            this.createModel({
                displayName: "Claude 3.5 Haiku",
                alias: "claude-3-5-haiku",
                name: "claude-3-5-haiku-20241022",
                provider: "anthropic",
            }),
        ];

        this.defaultModel = this.createModel({
            displayName: "Claude 3.5 Sonnet",
            alias: "claude-3-5-sonnet",
            name: "claude-3-5-sonnet-20241022",
            provider: "anthropic",
        });
        this.availableModels.push(this.defaultModel);

        // Populate the key map
        for (const model of this.availableModels) {
            this.keyToModelMap.set(model.key, model);
        }
    }

    public static initialize(): ModelManager {
        if (!ModelManager.instance) {
            ModelManager.instance = new ModelManager();
        }
        return ModelManager.instance;
    }

    public static getInstance(): ModelManager {
        if (!ModelManager.instance) {
            throw new Error("ModelManager not initialized");
        }
        return ModelManager.instance;
    }

    public keyToModel(key: string): ModelConfig {
        const model = this.keyToModelMap.get(key);
        if (!model) {
            throw new Error("Model not found");
        }
        return model;
    }

    public getAllModelKeys(): Record<string, string> {
        const options: Record<string, string> = {};
        this.availableModels.forEach((model) => {
            options[model.key] = `${model.provider}: ${model.displayName}`;
        });
        return options;
    }
}
