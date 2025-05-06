<script lang="ts">
    import type { AI } from "@/ai";
    import type { CerebroSettings } from "@/settings";
    import type { OverlayDataStore } from "@/stores/overlay.svelte";
    import InlineChat from "./InlineChat.svelte";
    import type { ModelSettingsStore } from "@/stores/convoParams.svelte";

    type Props = {
        ai: AI;
        settings: CerebroSettings;
        modelSettings: ModelSettingsStore;
        overlayData: OverlayDataStore;
    };

    let { overlayData, ...rest }: Props = $props();
</script>

<div
    id="cerebro-overlay-container"
    class="px-4 hidden lg:block absolute right-0 top-0 xl:w-1/4 h-full pointer-events-auto"
>
    {#each overlayData.data.conversations as conversation (conversation.id)}
        <InlineChat
            messageStore={conversation.messageStore}
            removeConversation={() => overlayData.removeConversation(conversation.id)}
            selectedText={conversation.selectedText}
            {...rest}
        />
    {/each}
</div>
