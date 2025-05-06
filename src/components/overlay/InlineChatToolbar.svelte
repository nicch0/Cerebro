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
        messageStore.length === 0 ? "How can I help you today?" : "Type your message here...",
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
</script>

<div
    id="cerebro-inline-toolbar"
    class="p-3 bg-background border-solid rounded-lg border-border border drop-shadow-sm w-full overflow-visible flex-col flex-grow flex gap-2 items-center"
>
    <Textarea
        {variant}
        {size}
        bind:value={prompt}
        placeholder={toolbarPlaceholder}
        onkeydown={handleKeydown}
        autofocus
    />

    <div class="ml-auto gap-1.5 flex flex-row justify-end">
        <Button variant="ghost" size="default" onclick={removeConversation}>Cancel</Button>
        <Button
            variant="default"
            size="default"
            onclick={completeUserResponse}
            disabled={isStreaming || prompt.trim().length === 0}
        >
            Comment
        </Button>
    </div>
</div>
