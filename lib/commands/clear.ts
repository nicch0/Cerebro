import { Command, Editor, MarkdownView, Notice } from "obsidian";
import ChatInterface from "../chatInterface";
import Cerebro from "../main";

export const clearChatCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-clear-chat",
    name: "Clear chat (except frontmatter)",
    icon: "trash",
    editorCallback: async (editor: Editor, view: MarkdownView) => {
        const chatInterface = plugin.chatInterfaceManager.getChatInView(view);
        try {
            chatInterface.clearConversationExceptFrontmatter(editor);
        } catch (e) {
            new Notice("[Cerebro] Error clearing chat");
        }
    },
});
