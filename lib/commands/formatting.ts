import { Command, Editor, MarkdownView } from "obsidian";
import ChatInterface from "../chatInterface";
import Cerebro from "../main";

export const addDividerCommand = (plugin: Cerebro): Command => ({
    id: "cerebro-add-hr",
    name: "Add divider",
    icon: "minus",
    editorCallback: (_: Editor, view: MarkdownView) => {
        const chatInterface = plugin.chatInterfaceManager.getChatInView(view);
        chatInterface.addHR();
    },
});

export const addCommentBlockCommand = (_plugin: Cerebro): Command => ({
    id: "cerebro-add-comment-block",
    name: "Add comment block",
    icon: "comment",
    editorCallback: (editor: Editor, _view: MarkdownView) => {
        const cursor = editor.getCursor();
        const { line, ch } = cursor;

        const commentBlock = `=begin-comment\n\n=end-comment`;
        editor.replaceRange(commentBlock, cursor);

        const newCursor = {
            line: line + 1,
            ch: ch,
        };
        editor.setCursor(newCursor);
    },
});
