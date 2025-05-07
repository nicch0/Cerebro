<script lang="ts">
    import { Button } from "@/components/ui/button";
    import { Textarea } from "@/components/ui/textarea";
    import * as DropdownMenu from "@/components/ui/dropdown-menu";
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
    id="cerebro-toolbar"
    class="p-4 bg-background border-solid rounded-lg border-border border drop-shadow-lg w-full overflow-visible"
>
    <Textarea
        {variant}
        {size}
        bind:value={prompt}
        placeholder={toolbarPlaceholder}
        onkeydown={handleKeydown}
        autofocus
    />

    <div class="flex justify-center items-center flex-wrap">
        <div class="flex flex-wrap justify-start items-center">
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    <span>{selectedModel.displayName}</span>
                    <ChevronDown />
                </DropdownMenu.Trigger>
                <!-- TODO: Split model providers into groups -->
                <DropdownMenu.Content class="bg-dropdown">
                    <DropdownMenu.Group>
                        {#each modelManager.availableModels as model (model.key)}
                            <DropdownMenu.Item
                                textValue={model.displayName}
                                onSelect={() => changeSelectedModel(model)}
                                >{model.displayName}</DropdownMenu.Item
                            >
                        {/each}
                    </DropdownMenu.Group>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </div>
        <Button variant="ghost" size="icon" onclick={toggleSearch}>
            <Globe class="size-4" />
            <span class="sr-only">Search</span>
        </Button>
        <Button variant="ghost" size="icon" onclick={toggleThink}>
            <Brain class="size-4" />
            <span class="sr-only">Think</span>
        </Button>

        <div class="ml-auto gap-1.5 flex flex-row">
            <Button variant="ghost" size="icon">
                <Paperclip class="size-4" />
                <span class="sr-only">Attach file</span>
            </Button>

            <Button variant="ghost" size="icon">
                <Mic class="size-4" />
                <span class="sr-only">Use Microphone</span>
            </Button>

            <Button
                variant="default"
                size="icon"
                onclick={completeUserResponse}
                disabled={isStreaming || prompt.trim().length === 0}
            >
                <ArrowUp />
            </Button>
        </div>
    </div>
</div>
