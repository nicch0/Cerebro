import { type Command, Editor, MarkdownView, Notice, SuggestModal } from "obsidian";
import { getModelOptions } from "../helpers";
import Cerebro from "../main";
import { MODEL_PROPERTY_NAME } from "../ai";

export const switchModelCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-switch-current-model",
    name: "Switch current model",
    icon: "exchange",
    editorCheckCallback: (
        checking: boolean,
        editor: Editor,
        view: MarkdownView,
    ): boolean | void => {
        // Only show this command when an editor is active with a file
        if (!view.file) {
            return false;
        }

        if (checking) {
            return true;
        }

        // Get model options from helper function
        const modelOptions = getModelOptions();

        // Create and open the model selection modal
        new ModelSelectorModal(plugin, editor, view, modelOptions).open();
    },
});

class ModelSelectorModal extends SuggestModal<string> {
    private modelOptions: Record<string, string>;
    private editor: Editor;
    private view: MarkdownView;

    constructor(
        private plugin: Cerebro,
        editor: Editor,
        view: MarkdownView,
        modelOptions: Record<string, string>,
    ) {
        super(plugin.app);
        this.modelOptions = modelOptions;
        this.editor = editor;
        this.view = view;
        this.setPlaceholder("Select a model to use");
    }

    getSuggestions(query: string): string[] {
        const keys = Object.keys(this.modelOptions);
        return keys.filter((key) =>
            this.modelOptions[key].toLowerCase().includes(query.toLowerCase()),
        );
    }

    renderSuggestion(value: string, el: HTMLElement): void {
        el.createEl("div", { text: this.modelOptions[value] });
    }

    async onChooseSuggestion(selectedModel: string): Promise<void> {
        try {
            const file = this.view.file;
            if (!file) {
                return;
            }

            // Update YAML frontmatter with new model value
            await this.plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
                frontmatter[MODEL_PROPERTY_NAME] = selectedModel;
            });

            new Notice(`Model changed to ${this.modelOptions[selectedModel]}`);
        } catch (error) {
            new Notice("[Cerebro] Error changing model: " + error);
        }
    }
}
