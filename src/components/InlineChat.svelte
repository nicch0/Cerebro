<script lang="ts">
    import MessageDisplay from "@/components/MessageDisplay.svelte";
    import { type MessageStore } from "@/stores/messages.svelte";
    import type { Message } from "@/types";
    import type { AI } from "@/ai";
    import type { CerebroSettings } from "@/settings";
    import type { ModelSettingsStore } from "@/stores/convoParams.svelte";
    import InlineChatToolbar from "./overlay/InlineChatToolbar.svelte";

    interface ChatProps {
        ai: AI;
        settings: CerebroSettings;
        modelSettings: ModelSettingsStore;
        messageStore: MessageStore;
        selectedText: string | undefined;
        removeConversation: () => void;
    }

    let { ai, settings, modelSettings, messageStore, selectedText, removeConversation }: ChatProps =
        $props();

    let incomingMessage: Message = $state({
        role: "assistant",
        content: "",
    });
    let isStreaming = $state(false);

    let hasMessages = $derived(messageStore.messages.length);

    const sendMessage = async ({ role, content }: { role: string; content: string }) => {
        // Update messages store with user message
        messageStore.addMessage(role, content);

        // Reset incoming message and mark as streaming
        incomingMessage.content = "";
        isStreaming = true;

        // Create a streaming callback that updates the incoming message
        const streamCallback = (chunk: string) => {
            incomingMessage.content += chunk;
        };

        // Make call to LLM with streaming callback
        const fullResponse = await ai.chat(
            messageStore.messages,
            modelSettings.params,
            settings,
            streamCallback,
        );

        // Mark streaming as complete
        isStreaming = false;

        // Add the final message to the messages store
        // Use the fullResponse instead of incomingMessage
        messageStore.addMessage(fullResponse.role, fullResponse.content);

        // Clear the incoming message after pushing to the messages store
        incomingMessage.content = "";
    };
</script>

<div
    id="cerebro-inline-chat"
    class="cursor-pointer bg-primary-alt border-border rounded-lg border border-2 drop-shadow-none hover:drop-shadow-lg focus-within:drop-shadow-lg"
>
    <div class="overflow-auto max-h-64">
        {#if hasMessages}
            <MessageDisplay
                {incomingMessage}
                {isStreaming}
                messages={messageStore.messages}
                layout="inline"
            />
        {/if}
    </div>
    <div class="w-full">
        <InlineChatToolbar
            variant="inline"
            size="inline"
            {sendMessage}
            {isStreaming}
            {messageStore}
            {selectedText}
            {removeConversation}
        />
    </div>
</div>
