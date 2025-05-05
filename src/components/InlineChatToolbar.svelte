<script lang="ts">
    import { Button } from "@/components/ui/button";
    import { Textarea } from "@/components/ui/textarea";
    import { Paperclip, ArrowUp, Globe, Brain, ChevronDown, Mic } from "@lucide/svelte";
    import type { Message, ModelConfig } from "@/types";
    import { Platform } from "obsidian";
    import ModelManager from "@/modelManager";
    import type { ModelSettingsStore } from "@/stores/convoParams.svelte";

    interface ToolbarProps {
        sendMessage: (message: { role: string; content: string }) => void;
        isStreaming: boolean;
        messages: Message[];
        selectedText: string | undefined;
        convoStore: ModelSettingsStore;
        variant?: string;
        size?: string;
    }

    let {
        sendMessage,
        isStreaming,
        messages,
        selectedText,
        convoStore,
        variant = "default",
        size = "default",
    }: ToolbarProps = $props();

    let prompt: string = $state("");

    if (selectedText) {
        prompt = selectedText;
    }
    let searchEnabled: boolean = $state(false);
    let thinkEnabled: boolean = $state(false);

    const modelManager = ModelManager.getInstance();

    // Using derived to get the current model from the store
    const selectedModel = $derived(convoStore.params.model);
    // const modelHasSearch = selectedModel?.capabilities?.search?.enabled;

    const toolbarPlaceholder = $derived(
        messages.length === 0 ? "How can I help you today?" : "Type your message here...",
    );

    const changeSelectedModel = (model: ModelConfig) => {
        // Call the store's update method
        convoStore.updateModel(model);
    };

    const toggleSearch = () => {
        searchEnabled = !searchEnabled;
    };

    const toggleThink = () => {
        thinkEnabled = !thinkEnabled;
    };

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
        // TODO: Cycle between old messages on arrowUp/arrowDown
    }
</script>

<div
    id="cerebro-inline-toolbar"
    class="p-3 bg-background border-solid rounded-lg border-border border drop-shadow-lg w-full overflow-visible flex-col flex gap-2 items-center"
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
        <Button
            variant="ghost"
            size="default"
            onclick={completeUserResponse}
            disabled={isStreaming || prompt.trim().length === 0}>Cancel</Button
        >
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
