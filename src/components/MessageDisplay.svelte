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
    }

    let { incomingMessage, isStreaming, messages }: MessageDisplayProps = $props();
</script>

{#snippet chatBubble(variant: string, message: Message)}
    <ChatBubble {variant}>
        <ChatBubbleMessage {variant}>
            <!-- TODO: Maybe only render the assistant's output? -->
            {@html marked(message.content)}
        </ChatBubbleMessage>
    </ChatBubble>
{/snippet}

<ChatMessageList>
    {#each messages as message (message?.id)}
        {#if message.role === "user"}
            {@render chatBubble("sent",message)}
        {:else}
            {@render chatBubble("received",message)}
        {/if}
    {/each}
    {#if isStreaming && incomingMessage.content.length > 0}
        {@render chatBubble("received", incomingMessage)}
    {:else if isStreaming && incomingMessage.content.length === 0}
        <ChatBubble variant="received" layout="ai">
            <ChatBubbleMessage isLoading variant="received" layout="ai" />
        </ChatBubble>
    {/if}
</ChatMessageList>
