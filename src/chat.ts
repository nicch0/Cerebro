import { MarkdownView, Notice, TFile } from "obsidian";
import { ERROR_NOTICE_TIMEOUT_MILLISECONDS } from "@/constants";
import { checkForChatFolderCreation } from "@/helpers";
import { logger } from "@/logger";
import type Cerebro from "@/main";
import { openView } from "@/utils/chatCreation";

export const openChat = async (plugin: Cerebro, chatInMainEditor: boolean, file?: TFile) => {
    try {
        const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);

        // Optionally include user's current text if selected
        const selectedText = activeView?.editor?.getSelection() || "";

        checkForChatFolderCreation(plugin);

        await openView(plugin, chatInMainEditor, selectedText, file);
    } catch (e) {
        logger.error(`[Cerebro] Error when creating new chat`, e.message);
        new Notice(
            `[Cerebro] Error while creating new chat. See console for more details. ${e.message}`,
            ERROR_NOTICE_TIMEOUT_MILLISECONDS,
        );
    }
};
