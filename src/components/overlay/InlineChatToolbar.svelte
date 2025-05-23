<script lang="ts">
    import { Button } from "@/components/ui/button";
    import { Textarea } from "@/components/ui/textarea";
    import { Platform } from "obsidian";
    import ModelManager from "@/modelManager";
    import type { MessageStore } from "@/stores/messages.svelte";

    interface ToolbarProps {
        sendMessage: (message: { role: string; content: string }) => void;
        isStreaming: boolean;
        messageStore: MessageStore;
        selectedText: string | undefined;
        variant?: string;
        size?: string;
        removeConversation: () => void;
    }

    let {
        sendMessage,
        isStreaming,
        messageStore,
        selectedText,
        variant = "default",
        size = "default",
        removeConversation,
    }: ToolbarProps = $props();

    let prompt: string = $state("");

    if (selectedText) {
        prompt = selectedText;
    }

    const modelManager = ModelManager.getInstance();

    const toolbarPlaceholder = $derived(
        messageStore.messages.length === 0
            ? "How can I help you today?"
            : "Type your message here...",
    );

    const completeUserResponse = async () => {
        const message = {
            role: "user",
            content: prompt,
        };
        // Clear inputs
        prompt = "";
        sendMessage(message);
    };

    function handleKeydown(event: KeyboardEvent) {
        if (event.isComposing || isStreaming) return;
        if (event.key === "Enter" && !event.shiftKey && prompt.trim().length > 0) {
            if (!Platform.isMobile) {
                event.preventDefault();
                completeUserResponse();
            }
        }
        // TODO: Cycle between old messageStore on arrowUp/arrowDown
    }

    const clearConversation = () => {
        prompt = "";
        if (messageStore.messages.length === 0) {
            removeConversation();
        }
    };
</script>

<div
    id="cerebro-inline-toolbar"
    class="p-2 bg-background border-solid rounded-lg border-border border w-full overflow-visible"
>
    <Textarea
        {variant}
        {size}
        bind:value={prompt}
        placeholder={toolbarPlaceholder}
        onkeydown={handleKeydown}
        autofocus
    />
    {#if prompt}
        <div class="ml-auto gap-1.5 flex flex-row justify-end">
            <Button variant="ghost" size="default" onclick={clearConversation}>Cancel</Button>
            <Button
                variant="default"
                size="default"
                onclick={completeUserResponse}
                disabled={isStreaming || prompt.trim().length === 0}
            >
                Comment
            </Button>
        </div>
    {/if}
</div>
