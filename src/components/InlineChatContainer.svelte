<script lang="ts">
    import type { AI } from "@/ai";
    import type { CerebroSettings } from "@/settings";
    import type { OverlayDataStore } from "@/stores/overlay.svelte";
    import InlineChat from "./InlineChat.svelte";
    import type { ModelSettingsStore } from "@/stores/convoParams.svelte";

    type Props = {
        ai: AI;
        settings: CerebroSettings;
        convoStore: ModelSettingsStore;
        overlayData: OverlayDataStore;
        selectedText: string | undefined;
    };

    let { overlayData, ...rest }: Props = $props();
</script>

<div
    id="cerebro-overlay-container"
    class="hidden lg:flex flex-col items-stretch justify-center absolute right-0 top-0 xl:w-1/5 2xl:w-1/4 h-full pointer-events-auto"
>
    {#each overlayData.data.conversations as conversation}
        <InlineChat messageStore={conversation.messageStore} {...rest} />
    {/each}
</div>
