import type { ConversationParameters, ModelConfig } from "@/types";

/**
 * Creates a conversation parameters store with reactive state
 * and methods for updating state with automatic persistence
 */
export const createConversationStore = (initialParams: ConversationParameters) => {
    // Core reactive state using Svelte 5 runes
    const params = $state({ ...initialParams });

    // Methods for updating state as arrow functions
    const updateModel = (model: ModelConfig): void => {
        params.model = model;
    };

    const updateSystem = (system: string[]): void => {
        params.system = system;
    };

    const updateTemperature = (temp: number): void => {
        params.temperature = temp;
    };

    const updateMaxTokens = (tokens: number): void => {
        params.maxTokens = tokens;
    };

    const updateTitle = (title: string): void => {
        params.title = title;
    };

    return {
        // Read-only access to state
        get params(): ConversationParameters {
            return params;
        },

        // Methods for updating state
        updateModel,
        updateSystem,
        updateTemperature,
        updateMaxTokens,
        updateTitle,
    };
};

// Export the type for use in components
export type ConversationStore = ReturnType<typeof createConversationStore>;
