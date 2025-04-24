<script lang="ts">
import Toolbar from "@/components/Toolbar.svelte";
import MessageDisplay from "@/components/MessageDisplay.svelte";
import { getMessages, pushMessage } from "./messages.svelte";
import type { ChatProperties, Message } from "@/types";
import type { AI } from "@/ai";
import type { CerebroSettings } from "@/settings";

interface ChatProps { ai: AI; settings: CerebroSettings };

let { ai, settings }: ChatProps = $props();

const messages = getMessages();
let incomingMessage: Message = $state({
    role: "assistant",
    content: "",
});
let isStreaming = $state(false);

let chatProperties: ChatProperties = $state({
    title: "Test title",
    model: "openai:gpt-4o-mini",
    stream: true,
    system: ["You are a helpful assistant"]
});

const sendMessage = async (message: Message) => {
    // Update messages store with user message
    pushMessage(message);

    // Reset incoming message and mark as streaming
    incomingMessage = {
        role: "assistant",
        content: "",
    };

    try {
        // Create a streaming callback that updates the incoming message
        const streamCallback = (chunk: string) => {
            incomingMessage.content += chunk;
        };

        // Make call to LLM with streaming callback
        const fullResponse = await ai.chat_v2(
            messages,
            chatProperties,
            settings,
            streamCallback
        );

        // Update with final message and mark streaming as complete
        incomingMessage = fullResponse;
        isStreaming = false;

        // Add the final message to the messages store
        pushMessage(incomingMessage);
    } catch (error) {
        console.error("Error in chat:", error);
    }
};

</script>

<div id="cerebro-chat-view" class="flex flex-nowrap flex-col">
    <MessageDisplay />
    <Toolbar
        sendMessage={sendMessage}
    />
</div>
