<script lang="ts">
    import { marked } from "marked";
    import type { Message } from "@/types";
    import ChatMessageList from "@/components/ui/chat/chat-message-list.svelte";
    import { ChatBubble } from "@/components/ui/chat/chat-bubble";
    import { ChatBubbleMessage } from "./ui/chat/chat-bubble";

    interface MessageDisplayProps {
        incomingMessage: Message;
        isStreaming: boolean;
        messages: Message[];
        layout: string;
    }

    let { incomingMessage, isStreaming, messages, layout }: MessageDisplayProps = $props();
</script>

{#snippet chatBubble(variant: string, message: Message, layout: string)}
    <ChatBubble {variant} {layout}>
        <ChatBubbleMessage {variant} {layout}>
            <!-- TODO: Maybe only render the assistant's output? -->
            {@html marked(message.content)}
        </ChatBubbleMessage>
    </ChatBubble>
{/snippet}

<ChatMessageList>
    {#each messages as message (message?.id)}
        {#if message.role === "user"}
            {@render chatBubble("sent", message, layout)}
        {:else}
            {@render chatBubble("received", message, layout)}
        {/if}
    {/each}
    {#if isStreaming && incomingMessage.content.length > 0}
        {@render chatBubble("received", incomingMessage, layout)}
    {:else if isStreaming && incomingMessage.content.length === 0}
        <ChatBubble variant="received" {layout}>
            <ChatBubbleMessage isLoading variant="received" />
        </ChatBubble>
    {/if}
</ChatMessageList>
