import type { SelectionRange } from "@codemirror/state";
import type { Tooltip, TooltipView } from "@codemirror/view";
import { MarkdownView } from "obsidian";
import { mount, unmount } from "svelte";
import InlineChatButton from "./components/overlay/InlineChatButton.svelte";
import type Cerebro from "./main";
import { createFileOverlayStore, type FileOverlayStore } from "./stores/overlay.svelte";
import Overlay from "./views/Overlay.svelte";

export class OverlayManager {
    private plugin: Cerebro;
    public overlays: Map<string, Overlay>;
    private fileOverlayStore: FileOverlayStore;

    constructor(plugin: Cerebro) {
        this.plugin = plugin;
        this.overlays = new Map();
        this.fileOverlayStore = createFileOverlayStore();
    }

    public updateViewForOverlay(view: MarkdownView): void {
        const overlay = this.getOverlayInView(view);
        overlay.view = view;
    }

    private getViewId(view: MarkdownView): string {
        // @ts-ignore:2239
        return view.leaf.id;
    }

    /**
     * Gets or creates an overlay for a view,
     * associating it with the centralized store
     */
    private getOverlayInView(view: MarkdownView): Overlay {
        const viewId: string = this.getViewId(view);
        if (!this.overlays.has(viewId)) {
            // Check for file data
            const overlayData = this.fileOverlayStore.getOverlayData(view.file?.path!);
            const overlay = new Overlay(this.plugin, view, overlayData);
            this.overlays.set(viewId, overlay);
        }

        return this.overlays.get(viewId)!;
    }

    /**
     * Gets the store instance for direct access to file data
     */
    public getOverlayStore(): FileOverlayStore {
        return this.fileOverlayStore;
    }

    public getVisibleMDViews(): MarkdownView[] {
        const views: MarkdownView[] = this.plugin.app.workspace
            .getLeavesOfType("markdown")
            .map((leaf) => leaf.view as MarkdownView)
            .filter((view) => view.contentEl);
        return views;
    }

    public setUpViews(): void {
        const views: MarkdownView[] = this.getVisibleMDViews();
        if (views.length === 0) {
            return;
        }

        views
            .filter((view) => view.file)
            .forEach((view) => {
                this.getOverlayInView(view);
            });
    }

    public removeAll(): void {
        this.overlays.forEach((overlay: Overlay) => {
            overlay.destroy();
        });
        this.overlays.clear();
    }

    public isOverlayActiveForView(view: MarkdownView): boolean {
        if (!view.file) {
            return false;
        }

        // Get active state from the store first
        const filePath = view.file.path;
        const fileData = this.fileOverlayStore.getOverlayData(filePath);
        return fileData.data.active;
    }

    public createTooltipButton(range: SelectionRange): Tooltip | undefined {
        const _createTooltipButton = (overlay: Overlay): TooltipView => {
            const div: HTMLDivElement = createEl("div");
            div.addClass("cerebro-overlay-tooltip");

            // Get the selected text from the editor
            const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
            if (!activeView || !activeView.editor) {
                return {
                    dom: div,
                    destroy: () => {},
                };
            }

            // Get the selected text using the range
            const selectedText = activeView.editor.getRange(
                activeView.editor.offsetToPos(range.from),
                activeView.editor.offsetToPos(range.to),
            );

            const component = mount(InlineChatButton, {
                target: div,
                props: {
                    onclick: () => overlay.createNewChat(range, selectedText),
                },
            });
            return {
                dom: div,
                destroy: () => unmount(component),
            };
        };
        const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) {
            throw new Error("activeView not found");
        }
        if (!this.plugin.overlayManager.isOverlayActiveForView(activeView)) {
            return;
        }

        const overlay = this.getOverlayInView(activeView);

        return {
            pos: range.head,
            above: false,
            create: () => {
                return _createTooltipButton(overlay);
            },
        };
    }
}
