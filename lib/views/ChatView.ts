import { ItemView, WorkspaceLeaf } from 'obsidian';
import { mount, unmount } from 'svelte';
import Toolbar from "../components/Toolbar.svelte";

export const CEREBRO_CHAT_VIEW = 'cerebro-chat-view';

export class ChatView extends ItemView {
  component: ReturnType<typeof Toolbar> | undefined;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return CEREBRO_CHAT_VIEW;
  }

  getDisplayText() {
    return 'Cerebro: New Chat';
  }

  async onOpen() {
    // Attach the Svelte component to the ItemViews content element and provide the needed props.
    this.component = mount(Toolbar, {
      target: this.contentEl,
      props: {}
    });
  }

  async onClose() {
    if (this.component) {
      unmount(this.component);
    }
  }
}
