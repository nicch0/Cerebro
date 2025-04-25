<script lang="ts">
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

{#snippet chatBubble(variant, layout, message)}
    <ChatBubble {variant} {layout}>
      <ChatBubbleMessage {variant}>
          {message.content}
      </ChatBubbleMessage>
    </ChatBubble>
{/snippet}

<ChatMessageList>
    {#each messages as message}
        {#if message.role === "user"}
            {@render chatBubble("sent", "default", message)}
        {:else}
            {@render chatBubble("received", "ai", message)}
        {/if}
    {/each}
    {#if isStreaming && incomingMessage.content.length > 0}
        {@render chatBubble("received", "ai", incomingMessage)}
    {:else if isStreaming && incomingMessage.content.length === 0}
        <ChatBubble variant='received' layout="ai">
            <ChatBubbleMessage isLoading variant="received" layout="ai"/>
        </ChatBubble>
    {/if}
</ChatMessageList>
