import { type Command, MarkdownView, Notice } from "obsidian";
import { ERROR_NOTICE_TIMEOUT_MILLISECONDS } from "../constants";
import { logger } from "../logger";
import Cerebro from "../main";
import { createNewChatFile, openInMainEditor } from "./chatCreation";

export const createNewChatCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-create-new-chat",
    name: "New Chat",
    icon: "message-square-plus",
    callback: async () => {
        try {
            const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
            const selectedText = activeView?.editor?.getSelection() || "";
            const newFile = await createNewChatFile(plugin, selectedText);
            if (!newFile) return;
            openInMainEditor(plugin, newFile);
        } catch (e) {
            logger.error(`[Cerebro] Error when creating new chat`, e);
            new Notice(
                `[Cerebro] Error while creating new chat. See console for more details. ${e.message}`,
                ERROR_NOTICE_TIMEOUT_MILLISECONDS,
            );
        }
    },
});
