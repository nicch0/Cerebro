import {
    type Extension,
    RangeSet,
    RangeSetBuilder,
    StateField,
    Transaction,
} from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, WidgetType } from "@codemirror/view";
import {
    App,
    editorInfoField,
    editorLivePreviewField,
    MarkdownRenderChild,
    MarkdownRenderer,
} from "obsidian";
import { fileIsChat } from "./helpers";
import Cerebro from "./main";

type Speaker = "assistant" | "user" | null;

const ASSISTANT_BREAKPOINT = "[assistant]";
const USER_BREAKPOINT = "[user]";

interface MessageBlock {
    speaker: Speaker;
    from: number;
    to: number;
}

class SpeechBubbleWidget extends WidgetType {
    private speaker: Speaker;
    private content: string;

    constructor(
        speaker: Speaker,
        content: string,
        private app: App,
    ) {
        super();
        this.speaker = speaker;
        this.content = content;
    }

    toDOM(view: EditorView): HTMLElement {
        const bubble = document.createElement("div");
        bubble.className = `chat-bubble ${this.speaker}-bubble cm-widget`; // Add cm-widget class
        bubble.contentEditable = "false"; // Prevent editing
        bubble.setAttribute("aria-hidden", "true"); // Optional: hide from screen readers

        const contentDiv = document.createElement("div");
        contentDiv.className = "bubble-content";

        // Create a container for the content with proper padding
        const formattedContent = this.content
            .trim()
            .split(/\n{2,}/) // Split on 3 or more newlines
            .map((block) => block.trim())
            .filter((block) => block.length > 0)
            .join("\n\n"); // Join with exactly two newlines

        console.log("formatted content", formattedContent);

        // Use Obsidian's markdown renderer
        const component = new MarkdownRenderChild(bubble);

        MarkdownRenderer.render(this.app, formattedContent, contentDiv, "", component);

        bubble.appendChild(contentDiv);
        return bubble;
    }
}

function buildDecorations(tr: Transaction, cerebro: Cerebro): DecorationSet {
    const doc = tr.state.doc;
    let currentBlock: MessageBlock | null = null;
    const blocks: MessageBlock[] = [];

    // Iterate through all lines
    for (let lineNo = 1; lineNo <= doc.lines; lineNo++) {
        const line = doc.line(lineNo);
        const lineText = line.text.trim();

        // Only create new blocks for marker lines
        if (lineText === ASSISTANT_BREAKPOINT || lineText === USER_BREAKPOINT) {
            if (currentBlock) {
                currentBlock.to = line.from;
                blocks.push(currentBlock);
            }
            currentBlock = {
                speaker: lineText === ASSISTANT_BREAKPOINT ? "assistant" : "user",
                from: line.from,
                to: 0,
            };
        }
    }

    if (currentBlock) {
        currentBlock.to = doc.length;
        blocks.push(currentBlock);
    }

    const builder = new RangeSetBuilder<Decoration>();
    for (const block of blocks) {
        if (block.speaker === "assistant") {
            // Just hide the [assistant] marker
            const markerLine = doc.lineAt(block.from);
            builder.add(
                block.from,
                markerLine.to,
                Decoration.replace({}), // Empty replacement hides the marker
            );
        } else if (block.speaker === "user") {
            const markerLine = doc.lineAt(block.from);
            const contentStart = markerLine.to + 1;
            const contentText = tr.state.doc.slice(contentStart, block.to);
            const content = contentText.sliceString(0, contentText.length, "\n");
            // Only style if it's not the last user block
            const lastUserBlock = [...blocks].reverse().find((block) => block.speaker === "user");
            if (block !== lastUserBlock) {
                builder.add(
                    block.from,
                    block.to,
                    Decoration.replace({
                        widget: new SpeechBubbleWidget(block.speaker, content, cerebro.app),
                    }),
                );
            }
        }
    }

    return builder.finish();
}

export const chatOverlayField = (cerebro: Cerebro) =>
    StateField.define<DecorationSet>({
        create(state) {
            state.update();
            return RangeSet.empty;
        },

        update(decorations, tr) {
            const view = tr.state.field(editorInfoField);
            const file = view?.file;
            const isChat = file && fileIsChat(cerebro.app, file);
            const isLivePreview = tr.state.field(editorLivePreviewField);
            // (tr.docChanged || decorations.size === 0) &&
            if (isChat && isLivePreview) {
                console.log("REBUILDING");
                return buildDecorations(tr, cerebro);
            }
            return RangeSet.empty;
        },
        provide: (field) => EditorView.decorations.from(field),
    });

// Use EditorInfoField.app
export const chatOverlayExtension = (cerebro: Cerebro): Extension => [chatOverlayField(cerebro)];
