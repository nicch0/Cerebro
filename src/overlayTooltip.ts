import { EditorState, SelectionRange, StateField } from "@codemirror/state";
import { showTooltip, type Tooltip, type TooltipView } from "@codemirror/view";
import { MarkdownView } from "obsidian";
import { mount, unmount } from "svelte";
import InlineChatButton from "./components/overlay/InlineChatButton.svelte";
import type Cerebro from "./main";

// Reference to plugin instance
let pluginInstance: Cerebro | null = null;

/**
 * Initialize the state field with a reference to the plugin
 */
export const initOverlayTooltipStateField = (plugin: Cerebro): void => {
    pluginInstance = plugin;
};

const createTooltipButton = (view: MarkdownView): TooltipView => {
    const div: HTMLDivElement = createEl("div");
    div.addClass("cerebro-overlay-tooltip");

    const component = mount(InlineChatButton, { target: div });
    return {
        dom: div,
        destroy: () => unmount(component),
    };
};

const getOverlayTooltips = (state: EditorState): readonly Tooltip[] => {
    return state.selection.ranges
        .filter((range) => !range.empty)
        .map((range: SelectionRange) => {
            if (!pluginInstance) {
                throw new Error("Plugin not initialized");
            }
            const activeView = pluginInstance.app.workspace.getActiveViewOfType(MarkdownView);
            if (!activeView) {
                throw new Error("activeView not found");
            }
            if (!pluginInstance.overlayManager.isOverlayActiveForView(activeView)) {
                console.log("overlay is not active");
                return;
            }
            return {
                pos: range.head,
                create: () => {
                    return createTooltipButton(activeView);
                },
            };
        });
};

export const overlayTooltipField = StateField.define<readonly Tooltip[]>({
    create: getOverlayTooltips,

    update(tooltips, tr) {
        // Check if this transaction is relevant to selection changes
        // Some transactions can be related to other editor changes
        const selectionChanged = tr.docChanged || tr.selection;

        // Skip processing if no selection-related changes occurred
        if (!selectionChanged) {
            return tooltips;
        }

        return getOverlayTooltips(tr.state);
    },

    provide: (f) => showTooltip.computeN([f], (state) => state.field(f)),
});
