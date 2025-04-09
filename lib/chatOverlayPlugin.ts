import { Decoration, DecorationSet, EditorView, GutterMarker, PluginSpec, PluginValue, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { Extension, Prec, RangeSet, RangeSetBuilder } from "@codemirror/state";
import { syntaxTree} from "@codemirror/language";
import { App, editorInfoField, editorLivePreviewField } from "obsidian";
import { fileIsChat } from "./helpers";

type Speaker = 'assistant' | 'user' | null;

const ASSISTANT_BREAKPOINT = '[assistant]';
const USER_BREAKPOINT = '[user]';

interface MessageBlock {
    speaker: Speaker;
    from: number;
    to: number;
}

class EmojiWidget extends WidgetType {
  toDOM(view: EditorView): HTMLElement {
    const div = document.createElement('span');

    div.innerText = '👉';

    return div;
  }
}

class ChatOverlayPlugin implements PluginValue {
    decorations: DecorationSet;
    private _app: App;

    constructor(view: EditorView, app: App) {
        this.decorations = this.buildDecorations(view);
        this._app = app;
        this.buildDecorations(view);
    }

    buildDecorations(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        const doc = view.state.doc;

        let currentBlock: MessageBlock | null = null;
        const blocks: MessageBlock[] = [];

        // Iterate through all lines
        for (let lineNo = 1; lineNo <= doc.lines; lineNo++) {
            const line = doc.line(lineNo);

            const lineText = line.text.trim();

            if (lineText === ASSISTANT_BREAKPOINT) {
                if (currentBlock) {
                    currentBlock.to = line.from;
                    blocks.push(currentBlock);
                }
                currentBlock = {
                    speaker: 'assistant',
                    from: line.to, // start after the market
                    to: 0,         // is set when next speaker is found
                }
            } else if (lineText === USER_BREAKPOINT) {
                if (currentBlock) {
                    currentBlock.to = line.from;
                    blocks.push(currentBlock);
                }
                currentBlock = {
                    speaker: 'user',
                    from: line.to,
                    to: 0
                };
            }
        }
        // Don't forget the last block
        if (currentBlock) {
            currentBlock.to = doc.length;
            blocks.push(currentBlock);
        }

        // Create decorations for each block
        for (const block of blocks) {
            console.log(`Found ${block.speaker} message: ${view.state.doc.slice(block.from, block.to)}`);
            // Add your decorations here
        }

        return builder.finish();
    }

    update(update: ViewUpdate) {
        const info = update.view.state.field(editorInfoField);
        const file = info?.file;
        const isChat = file && fileIsChat(this._app, file);
        if ((update.docChanged || update.viewportChanged) && isChat && update.view.state.field(editorLivePreviewField)) {
            this.decorations = this.buildDecorations(update.view);
        } else {
            this.decorations = RangeSet.empty;
        }
        return this.decorations;
    }

    destroy() {}
}

const pluginSpec: PluginSpec<ChatOverlayPlugin> = {
  decorations: (value: ChatOverlayPlugin) => value.decorations,
};

export const chatOverlayPlugin = {
    init: (app: App): Extension => ViewPlugin.define(
        (view: EditorView) => new ChatOverlayPlugin(view, app),
        pluginSpec
    )
};
