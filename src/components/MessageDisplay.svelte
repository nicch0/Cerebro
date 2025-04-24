<script lang="ts">
import type { Message } from "@/types";
import MessageComponent from "./Message.svelte";
import { getMessages } from "./messages.svelte";

interface MessageDisplayProps {
    incomingMessage: Message;
    isStreaming: boolean;
}

let {incomingMessage, isStreaming } : MessageDisplayProps = $props();
let messages = getMessages();

</script>

<div>
{#each messages as message}
    <MessageComponent
        message={message}
    />
{/each}
{#if isStreaming && incomingMessage.content.length > 0}
    <MessageComponent
        message={incomingMessage}
    />
{/if}
</div>
