import { EditorState, SelectionRange, StateField } from "@codemirror/state";
import { showTooltip, type Tooltip } from "@codemirror/view";
import type Cerebro from "./main";

// Reference to plugin instance
let pluginInstance: Cerebro | null = null;

/**
 * Initialize the state field with a reference to the plugin
 */
export const initOverlayTooltipStateField = (plugin: Cerebro): void => {
    pluginInstance = plugin;
};

const getOverlayTooltips = (state: EditorState): readonly Tooltip[] => {
    return state.selection.ranges
        .filter((range) => !range.empty)
        .map((range: SelectionRange) => {
            if (!pluginInstance) {
                throw new Error("Plugin not initialized");
            }
            return pluginInstance.overlayManager.createTooltipButton(range);
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
