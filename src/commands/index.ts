import type { Command } from "obsidian";
import Cerebro from "../main";
import { loadExistingChatCommand } from "./loadChat";
import { createNewChatInSidebarCommand, startNewConversationCommand } from "./newChat";
import { chooseChatTemplateCommand } from "./newChatFromTemplate";
import { toggleOverlayCommand } from "./toggleOverlay";

export const getCommands = (plugin: Cerebro): Command[] => [
    startNewConversationCommand(plugin),
    createNewChatInSidebarCommand(plugin),
    // inferTitleCommand(plugin),
    chooseChatTemplateCommand(plugin),
    loadExistingChatCommand(plugin),
    toggleOverlayCommand(plugin),
];
