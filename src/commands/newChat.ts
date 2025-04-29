import { type Command } from "obsidian";
import { openChat } from "../chat";
import Cerebro from "../main";

export const createNewChatCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-create-new-chat",
    name: "New Chat",
    icon: "message-square-plus",
    callback: async () => openChat(plugin, true),
});

export const createNewChatInSidebarCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-create-new-chat-in-sidebar",
    name: "New Chat in Sidebar",
    icon: "panel-right",
    callback: async () => openChat(plugin, false),
});
