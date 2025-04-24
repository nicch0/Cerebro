<script lang="ts">
    import type { Message } from "@/types";
    import { getMessages } from "@/components/messages.svelte";
    import ChatMessageList from "@/components/ui/chat/chat-message-list.svelte";
    import { ChatBubble } from "@/components/ui/chat/chat-bubble";
    import { ChatBubbleMessage } from "./ui/chat/chat-bubble";

    interface MessageDisplayProps {
        incomingMessage: Message;
        isStreaming: boolean;
    }

    let { incomingMessage, isStreaming }: MessageDisplayProps = $props();
    let messages = getMessages();
</script>

<ChatMessageList>
    {#each messages as message}
        {#if message.role === "user"}
            <ChatBubble variant='sent'>
              <ChatBubbleMessage variant='sent'>
                  {message.content}
              </ChatBubbleMessage>
            </ChatBubble>
        {:else}
            <ChatBubble variant='received'>
            <ChatBubbleMessage variant='received'>
                {message.content}
            </ChatBubbleMessage>
            </ChatBubble>
        {/if}
    {/each}
    {#if isStreaming && incomingMessage.content.length > 0}
        <ChatBubble variant='received'>
        <ChatBubbleMessage variant='received'>
            {incomingMessage.content}
        </ChatBubbleMessage>
        </ChatBubble>
    {:else if incomingMessage.content.length === 0}
        <ChatBubble variant='received'>
            <ChatBubbleMessage isLoading/>
        </ChatBubble>
    {/if}
</ChatMessageList>
