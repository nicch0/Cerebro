<script lang="ts">
    import Toolbar from "@/components/Toolbar.svelte";
    import MessageDisplay from "@/components/MessageDisplay.svelte";
    import { type MessageStore } from "@/stores/messages.svelte";
    import type { Message } from "@/types";
    import type { AI } from "@/ai";
    import type { CerebroSettings } from "@/settings";
    import type { ModelSettingsStore } from "@/stores/convoParams.svelte";
    import InlineChatToolbar from "./InlineChatToolbar.svelte";

    interface ChatProps {
        ai: AI;
        settings: CerebroSettings;
        convoStore: ModelSettingsStore;
        messageStore: MessageStore;
        selectedText: string | undefined;
    }

    let { ai, settings, convoStore, messageStore, selectedText }: ChatProps = $props();

    let incomingMessage: Message = $state({
        role: "assistant",
        content: "",
    });
    let isStreaming = $state(false);

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
            convoStore.params,
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

<div id="cerebro-inline-chat" class="flex flex-col lg:max-h-lg border-4">
    <div class="overflow-auto">
        <MessageDisplay {incomingMessage} {isStreaming} messages={messageStore.messages} />
    </div>
    <div class="sticky bottom-0 w-full">
        <InlineChatToolbar
            variant="inline"
            size="inline"
            {sendMessage}
            {isStreaming}
            {convoStore}
            messages={messageStore.messages}
            {selectedText}
        />
    </div>
</div>
