import InlineChatContainer from "@/components/InlineChatContainer.svelte";
import OverlayToggleButton from "@/components/overlay/OverlayToggleButton.svelte";
import type Cerebro from "@/main";
import ModelManager from "@/modelManager";
import { createModelSettingsStore, type ModelSettingsStore } from "@/stores/convoParams.svelte";
import type { OverlayDataStore } from "@/stores/overlay.svelte";
import type { SelectionRange } from "@codemirror/state";
import { type EditorRange, type MarkdownView } from "obsidian";
import { mount, unmount } from "svelte";

export const CEREBRO_OVERLAY_VIEW = "cerebro-overlay-view";

export default class Overlay {
    private plugin: Cerebro;
    public view: MarkdownView;

    private overlayToggleButton: ReturnType<typeof OverlayToggleButton> | undefined;
    private inlineChatContainer: ReturnType<typeof InlineChatContainer> | undefined;

    private overlayData: OverlayDataStore;
    private modelManager: ModelManager;
    private modelSettingsStore: ModelSettingsStore;

    constructor(plugin: Cerebro, view: MarkdownView, overlayData: OverlayDataStore) {
        this.plugin = plugin;
        this.view = view;
        this.overlayData = overlayData;
        this.modelManager = ModelManager.getInstance();
        this.modelSettingsStore = createModelSettingsStore({
            title: "",
            model: this.plugin.settings.modelDefaults.model,
            system: this.plugin.settings.modelDefaults.system,
            temperature: this.plugin.settings.modelDefaults.temperature,
            maxTokens: this.plugin.settings.modelDefaults.maxTokens,
        });

        this.mountComponents();

        // Initialize with the store's state or default to false
        this.setupEventListeners();
    }

    // private getCmLine(editor: Editor, range: SelectionRange) {
    //     // Find the line element using the range
    //     // Convert the from position to a line number
    //     const fromLine = editor.offsetToPos(range.from).line;

    //     // Get the actual DOM element for the line
    //     // First get the CodeMirror editor DOM
    //     const cmEditor = this.view.containerEl.querySelector(".cm-editor");
    //     if (!cmEditor) {
    //         throw new Error("[Cerebro] Cannot create chat: No CodeMirror editor found");
    //     }

    //     // Find the line element by its line number
    //     const lineElements = cmEditor.querySelectorAll(".cm-line");
    //     if (!lineElements || lineElements.length <= fromLine) {
    //         throw new Error(`[Cerebro] Cannot create chat: Line ${fromLine} not found`);
    //     }

    //     return lineElements[fromLine] as HTMLElement;
    // }

    /**
     * Creates a new chat component anchored to a specific line in the editor
     * @param range The CodeMirror selection range
     * @param selectedText The selected text that will be used as context for the chat
     */
    public createNewChat(range: SelectionRange, selectedText: string): void {
        // Get the editor view
        const editor = this.view.editor;

        const editorRange: EditorRange = {
            from: range.from,
            to: range.to,
        };

        // Find the line element using the range
        // Convert the from position to a line number
        const fromLine = editor.offsetToPos(range.from).line;

        if (!this.inlineChatContainer) {
            throw new Error("[Cerebro] Cannot create chat: No inline chat container found");
        }

        this.overlayData.addInlineConversation(editorRange, selectedText);

        // // Get the actual DOM element for the line
        // // First get the CodeMirror editor DOM
        // const cmEditor = this.view.containerEl.querySelector(".cm-sizer");
        // if (!cmEditor) {
        //     throw new Error("[Cerebro] Cannot create chat: No CodeMirror editor found");
        // }

        // // Find the line element by its line number
        // const lineElements = cmEditor.querySelectorAll(".cm-line");
        // if (!lineElements || lineElements.length <= fromLine) {
        //     throw new Error(`[Cerebro] Cannot create chat: Line ${fromLine} not found`);
        // }

        // const cmLine = lineElements[fromLine] as HTMLElement;
        // const messageStore = createMessageStore();

        // const chat = mount(InlineChat, {
        //     target: cmEditor,
        //     props: {
        //         ai: this.plugin.ai,
        //         settings: this.plugin.settings,
        //         convoStore: this.modelSettingsStore,
        //         messageStore,
        //         selectedText,
        //     },
        // });

        // // Insert the container after the line element
        // lineElement.insertAdjacentElement("afterend", chatContainer);

        // // Create stores for the chat
        // const messageStore = createMessageStore();

        // // Add selected text as the first user message if available
        // if (selectedText && selectedText.trim().length > 0) {
        //     messageStore.addMessage("user", selectedText);
        // }

        // // Mount the Chat component
        // mount(Chat, {
        //     target: chatContainer,
        //     props: {
        //         ai: this.plugin.ai,
        //         settings: this.plugin.settings,
        //         convoStore: this.modelSettingsStore,
        //         messageStore: messageStore,
        //         selectedText: "", // Leave empty since we already added it to messages
        //     },
        // });

        // // Store the thread in the overlay data store
        // if (this.view.file) {
        //     const filePath = this.view.file.path;
        //     this.overlayData.addCommentThread(filePath, {
        //         id: `comment-${Date.now()}`,
        //         range: range,
        //         position: fromLine,
        //         messageStore: messageStore,
        //     });
        // }
    }

    private mountInlineChatContainer(): void {
        // Get the actual DOM element for the line
        // First get the CodeMirror editor DOM
        const container = this.view.containerEl.querySelector(".cm-scroller");
        if (!container) {
            throw new Error("[Cerebro] Cannot create chat: No CodeMirror editor found");
        }
        this.inlineChatContainer = mount(InlineChatContainer, {
            target: container,
            anchor: container?.firstChild?.after() || undefined,
            props: {
                ai: this.plugin.ai,
                settings: this.plugin.settings,
                modelSettings: this.modelSettingsStore,
                overlayData: this.overlayData,
            },
        });

        // TODO: REMOVE
        this.overlayData.addInlineConversation(
            { from: 10, to: 200 },
            "The scollbar colour utilities are inherited, so if you want to use the same colours on every custom scrollbar, you can define them at a high-level element (e.g. html) and then simply add scrollbar or scrollbar-thin to each scrollbar you'd like to apply custom styling to.",
        );
    }

    private mountToggleButton(): void {
        const viewActions: HTMLElement | null =
            this.view.containerEl.querySelector(".view-actions");

        if (viewActions) {
            this.overlayToggleButton = mount(OverlayToggleButton, {
                target: viewActions,
                anchor: viewActions?.firstChild || undefined,
                props: {
                    data: this.overlayData.data,
                    toggleActive: this.overlayData.toggleActive,
                },
            });
        }
    }

    public mountComponents(): void {
        // TODO: Support RHS
        this.mountToggleButton();
        this.mountInlineChatContainer();
    }

    public setupEventListeners(): void {}

    public getViewType(): string {
        return CEREBRO_OVERLAY_VIEW;
    }

    public getDisplayText(): string {
        return "Cerebro Overlay";
    }

    public destroy(): void {
        if (this.overlayToggleButton) {
            unmount(this.overlayToggleButton);
        }
        if (this.inlineChatContainer) {
            unmount(this.inlineChatContainer);
        }
    }
}
