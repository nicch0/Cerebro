<script lang="ts">
    import { Button } from "@/components/ui/button";
    import { Textarea } from "@/components/ui/textarea";
    import * as DropdownMenu from "@/components/ui/dropdown-menu";
    import { Paperclip, ArrowUp, Globe, Brain, ChevronDown, Mic } from "@lucide/svelte";
    import type { Message } from "@/types";
    import { Platform } from "obsidian";

    interface ToolbarProps {
        sendMessage: (message: Message) => void;
        isStreaming: boolean;
        messages: Message[];
    }

    let { sendMessage, isStreaming, messages }: ToolbarProps = $props();

    let prompt: string = $state("");
    let searchEnabled: boolean = $state(false);
    let thinkEnabled: boolean = $state(false);
    let selectedModel: string = $state("");
    const toolbarPlaceholder = $derived(
        messages.length === 0 ? "How can I help you today?" : "Type your message here...",
    );

    const toggleSearch = () => {
        searchEnabled = !searchEnabled;
        console.log("Search", searchEnabled);
    };

    const toggleThink = () => {
        thinkEnabled = !thinkEnabled;
        console.log("Think", thinkEnabled);
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

    const modelOptions: string[] = ["Model A", "Model B", "Model C", "Model D"];

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

<div id="cerebro-toolbar" class="bg-background border-solid rounded-lg border-border border px-2 drop-shadow-lg bottom-0 w-full overflow-visible">
    <Textarea
        bind:value={prompt}
        placeholder={toolbarPlaceholder}
        class="flex-1 h-20 bg-background border-none shadow-none text-base leading-6 resize-none outline-none focus-visible:ring-0 placeholder:text-small placeholder:text-muted"
        onkeydown={handleKeydown}
    />

    <div class="flex justify-center items-center p-3 pt-0">
        <div class="flex flex-wrap justify-start items-center">
            <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                    <span>Model Name</span>
                    <ChevronDown />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content class="bg-dropdown">
                    <DropdownMenu.Group>
                        {#each modelOptions as model}
                            <DropdownMenu.Item>{model}</DropdownMenu.Item>
                        {/each}
                    </DropdownMenu.Group>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </div>

      <Button variant="ghost" size="icon">
        <Paperclip class="size-4" />
        <span class="sr-only">Attach file</span>
      </Button>

      <Button variant="ghost" size="icon">
        <Mic class="size-4" />
        <span class="sr-only">Use Microphone</span>
      </Button>

      <Button variant="ghost" size="icon" onclick={toggleSearch}>
          <Globe class="size-4" />
          <span class="sr-only">Search</span>
      </Button>

      <Button variant="ghost" size="icon" onclick={toggleThink}>
          <Brain class="size-4" />
          <span class="sr-only">Think</span>
      </Button>

      <Button
          class="ml-auto gap-1.5"
          variant="default"
          size="icon"
          onclick={completeUserResponse}
          disabled={isStreaming || prompt.trim().length === 0}
      >
          <ArrowUp />
      </Button>
    </div>
</div>
