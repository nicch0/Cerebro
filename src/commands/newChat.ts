import { type Command } from "obsidian";
import { openChat } from "../chat";
import Cerebro from "../main";

export const startNewConversationCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-start-new-conversation",
    name: "Start new conversation",
    icon: "message-square-plus",
    callback: async () => openChat(plugin, true),
});

export const createNewChatInSidebarCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-start-new-conversation-in-sidebar",
    name: "Start new conversation in sidebar",
    icon: "panel-right",
    callback: async () => openChat(plugin, false),
});
