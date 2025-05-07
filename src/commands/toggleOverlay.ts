import { CEREBRO_LUCIDE_ICON } from "@/constants";
import type Cerebro from "@/main";
import { MarkdownView, Notice, type Command } from "obsidian";

export const toggleOverlayCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-toggle-overlay",
    name: "Toggle Overlay",
    icon: CEREBRO_LUCIDE_ICON,
    callback: async () => {
        const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            plugin.overlayManager.toggleOverlayActive(activeView);
        } else {
            new Notice("No active files opened.");
        }
    },
});
