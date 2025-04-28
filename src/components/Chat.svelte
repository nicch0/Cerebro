<script lang="ts">
    import Toolbar from "@/components/Toolbar.svelte";
    import MessageDisplay from "@/components/MessageDisplay.svelte";
    import { type MessageStore } from "./messages.svelte";
    import type { ChatProperty, Message } from "@/types";
    import type { AI } from "@/ai";
    import type { CerebroSettings } from "@/settings";

    interface ChatProps {
        ai: AI;
        settings: CerebroSettings;
        chatProperties: ChatProperty;
        messageStore: MessageStore;
        selectedText: string | undefined;
    }

    let { ai, settings, chatProperties, messageStore, selectedText }: ChatProps = $props();

    let incomingMessage: Message = $state({
        role: "assistant",
        content: "",
    });
    let isStreaming = $state(false);

    const sendMessage = async ({ role, content }: { role: string; content: string }) => {
        // Update messages store with user message
        messageStore.push(role, content);

        // Reset incoming message and mark as streaming
        incomingMessage.content = "";
        isStreaming = true;

        try {
            // Create a streaming callback that updates the incoming message
            const streamCallback = (chunk: string) => {
                incomingMessage.content += chunk;
            };

            // Make call to LLM with streaming callback
            const fullResponse = await ai.chat(
                messageStore.messages,
                chatProperties,
                settings,
                streamCallback,
            );

            // Mark streaming as complete
            isStreaming = false;

            // Add the final message to the messages store
            // Use the fullResponse instead of incomingMessage
            messageStore.push(fullResponse.role, fullResponse.content);

            // Clear the incoming message after pushing to the messages store
            incomingMessage.content = "";
        } catch (   error) {
            console.error("Error in chat:", error);
        }
    };
</script>

<div id="cerebro-chat-view" class="flex flex-col size-full overflow-hidden">
    <MessageDisplay {incomingMessage} {isStreaming} messages={messageStore.messages} />
    <Toolbar
        {sendMessage}
        {isStreaming}
        {chatProperties}
        messages={messageStore.messages}
        {selectedText}
    />
</div>
