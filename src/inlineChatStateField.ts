import { type Extension, RangeSetBuilder, StateField, Transaction } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView } from "@codemirror/view";
import { MarkdownView } from "obsidian";
import type Cerebro from "./main";

// Track last selection globally for the plugin
let lastSelection: { from: number; to: number } | null = null;

// Reference to plugin instance
let pluginInstance: Cerebro | null = null;

/**
 * Initialize the state field with a reference to the plugin
 */
export function initInlineChatStateField(plugin: Cerebro): void {
    pluginInstance = plugin;
}

/**
 * State field that tracks text selection and shows the inline chat button
 */
export const CerebroInlineChatField = StateField.define<DecorationSet>({
    create(state): DecorationSet {
        return Decoration.none;
    },
    update(oldState: DecorationSet, transaction: Transaction): DecorationSet {
        if (!pluginInstance) return Decoration.none;

        const selection = transaction.state.selection;
        const builder = new RangeSetBuilder<Decoration>();

        // Check if this transaction is relevant to selection changes
        // Some transactions can be related to other editor changes
        const selectionChanged = transaction.docChanged || transaction.selection;

        // Skip processing if no selection-related changes occurred
        if (!selectionChanged) return oldState;

        // Only track real selection changes (not just cursor movement)
        if (!selection.main.empty) {
            const from = selection.main.from;
            const to = selection.main.to;

            // Check if this is a new selection or a different one from last time
            const isNewSelection =
                !lastSelection || lastSelection.from !== from || lastSelection.to !== to;

            if (isNewSelection) {
                lastSelection = { from, to };

                // Get the active view
                const activeView = pluginInstance.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView) {
                    // Show the inline chat button through the overlay manager
                    const selectedText = transaction.state.doc.sliceString(from, to);
                    pluginInstance.overlayManager.showInlineChatButtonForSelection(
                        activeView,
                        selectedText,
                        { from, to },
                    );
                }
            }
        } else {
            // If selection is empty (just cursor), clear the last selection and hide the button
            if (lastSelection !== null) {
                lastSelection = null;

                // Hide the button when selection is cleared
                const activeView = pluginInstance.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView) {
                    pluginInstance.overlayManager.hideInlineChatButton(activeView);
                }
            }
        }

        return builder.finish();
    },
    provide(field: StateField<DecorationSet>): Extension {
        return EditorView.decorations.from(field);
    },
});
