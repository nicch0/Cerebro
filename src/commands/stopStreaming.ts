import { ERROR_NOTICE_TIMEOUT_MILLISECONDS } from "../constants";
import { logger } from "../logger";
import Cerebro from "../main";
import { type Command, Editor, MarkdownView, Notice } from "obsidian";

export const stopStreamingCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-stop-streaming",
    name: "Stop streaming",
    icon: "square",
    editorCallback: async (_: Editor, view: MarkdownView) => {
        try {
            const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
            if (!activeView) throw new Error("No active markdown view");
            if (!view.file) throw new Error("No active file");
            const chat = plugin.chatInterfaceManager.getChatInView(activeView);
            chat.stopStreaming = true;
        } catch (e) {
            logger.error(`[Cerebro] Error when stopping stream`, e);
            new Notice(
                `[Cerebro] Error while stopping stream. See console for more details. ${e.message}`,
                ERROR_NOTICE_TIMEOUT_MILLISECONDS,
            );
        }
    },
});
