import { Decoration, DecorationSet, EditorView, WidgetType } from "@codemirror/view";
import { Extension, RangeSet, RangeSetBuilder, StateField, Transaction, Text } from "@codemirror/state";
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

class SpeechBubbleWidget extends WidgetType {
    private speaker: Speaker;
    private content: string;

    constructor(speaker: Speaker, content: Text) {
        super();
        this.speaker = speaker;
        this.content = content.sliceString(0, content.length, '\n');
    }

    toDOM(view: EditorView): HTMLElement {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${this.speaker}-bubble`;

        bubble.innerHTML = `
            <div class="bubble-content">
                ${this.content}
            </div>
        `;
        return bubble;
    }
}

function buildDecorations(tr: Transaction, app: App): DecorationSet {
    const doc = tr.state.doc;
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
                from: line.to,
                to: 0,
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

    if (currentBlock) {
        currentBlock.to = doc.length;
        blocks.push(currentBlock);
    }

    const builder = new RangeSetBuilder<Decoration>();
    for (const block of blocks) {
        if (block.speaker === "user") {
            const content = tr.state.doc.slice(block.from, block.to);
            builder.add(
                block.from,
                block.to,
                Decoration.replace({
                    widget: new SpeechBubbleWidget(block.speaker, content),
                })
            );
        }
    }

    return builder.finish();
}

export const chatOverlayField = (app: App) => StateField.define<DecorationSet>({
    create(state) {
        return RangeSet.empty;
    },

    update(decorations, tr) {
        const view = tr.state.field(editorInfoField);
        const file = view?.file;
        const isChat = file && fileIsChat(app, file);
        const isLivePreview = tr.state.field(editorLivePreviewField);
        if ((tr.docChanged || decorations.size === 0) && isChat && isLivePreview) {
            console.log("REBUILDING");
            return buildDecorations(tr, app);
        } else {
            return RangeSet.empty;
        }
    },

    provide: field => EditorView.decorations.from(field)
});

// Use EditorInfoField.app
export const chatOverlayExtension = (app: App): Extension => [
    chatOverlayField(app)
];
