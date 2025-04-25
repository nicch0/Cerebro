import type { Command } from "obsidian";
import Cerebro from "../main";
import { chatCommand } from "./chat";
import { clearChatCommand } from "./clear";
import { addCommentBlockCommand, addDividerCommand } from "./formatting";
import { inferTitleCommand } from "./inferTitle";
import { createNewChatCommand, createNewChatInSidebarCommand } from "./newChat";
import { stopStreamingCommand } from "./stopStreaming";
import { switchModelCommand } from "./switchModel";
import { chooseChatTemplateCommand } from "./template";

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
