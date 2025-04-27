<script lang="ts">
    import { Button } from "@/components/ui/button";
    import { Textarea } from "@/components/ui/textarea";
    import * as DropdownMenu from "@/components/ui/dropdown-menu";
    import { Paperclip, ArrowUp, Globe, Brain, ChevronDown, Mic } from "@lucide/svelte";
    import type { ChatProperty, Message, ModelConfig } from "@/types";
    import { Platform } from "obsidian";
    import { AVAILABLE_MODELS } from "@/ai";
    import { modelToKey } from "@/helpers";

    interface ToolbarProps {
        sendMessage: (message: Message) => void;
        isStreaming: boolean;
        messages: Message[];
        selectedText: string;
        chatProperties: ChatProperty;
    }

    let { sendMessage, isStreaming, messages, selectedText, chatProperties }: ToolbarProps = $props();

    let prompt: string = $state("");

    if (selectedText) {
        prompt = selectedText;
    }
    let searchEnabled: boolean = $state(false);
    let thinkEnabled: boolean = $state(false);
    let selectedModel: ModelConfig = $state(chatProperties.model);
    const toolbarPlaceholder = $derived(
        messages.length === 0 ? "How can I help you today?" : "Type your message here...",
    );

    const changeSelectedModel = (model: ModelConfig) => {
        selectedModel = model;
    }

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
    class="bg-background border-solid rounded-lg border-border border py-2 px-1 drop-shadow-lg bottom-0 w-full overflow-visible"
>
    <Textarea
        bind:value={prompt}
        placeholder={toolbarPlaceholder}
        class="flex-1 h-20 bg-background border-none shadow-none text-base leading-6 resize-none outline-none hover:bg-transparent focus-visible:outline-none focus-visible:ring-0 placeholder:text-small placeholder:text-muted"
        onkeydown={handleKeydown}
    />

    <div class="flex justify-center items-center p-3 pt-0">
        <div class="flex flex-wrap justify-start items-center">
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    <span>{selectedModel.provider}: {selectedModel.alias || selectedModel.name}</span>
                    <ChevronDown />
                </DropdownMenu.Trigger>
                <!-- TODO: Split model providers into groups -->
                <DropdownMenu.Content class="bg-dropdown">
                    <DropdownMenu.Group>
                        {#each AVAILABLE_MODELS as model (modelToKey(model))}
                            <DropdownMenu.Item textValue={modelToKey(model)} onSelect={() => changeSelectedModel(model)}>{model.provider}: {model.alias || model.name}</DropdownMenu.Item>
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
