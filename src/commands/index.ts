import type { Command } from "obsidian";
import Cerebro from "../main";
import { chatCommand } from "./chat";
import { clearChatCommand } from "./clear";
import { addCommentBlockCommand, addDividerCommand } from "./formatting";
import { createNewChatCommand } from "./newChat";
import { createNewChatInSidebarCommand } from "./newChatInSidebar";
import { stopStreamingCommand } from "./stopStreaming";
import { chooseChatTemplateCommand } from "./template";
import { inferTitleCommand } from "./inferTitle";
import { switchModelCommand } from "./switchModel";

export const getCommands = (plugin: Cerebro): Command[] => [
    createNewChatCommand(plugin),
    createNewChatInSidebarCommand(plugin),
    chatCommand(plugin),
    addDividerCommand(plugin),
    addCommentBlockCommand(plugin),
    inferTitleCommand(plugin),
    chooseChatTemplateCommand(plugin),
    clearChatCommand(plugin),
    stopStreamingCommand(plugin),
    switchModelCommand(plugin),
];
