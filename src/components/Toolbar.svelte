<script lang="ts">
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import * as DropdownMenu from "@/components/ui/dropdown-menu";
import { Paperclip, ArrowUp, Globe, Brain, ChevronDown } from "@lucide/svelte";
import { getMessages } from "@/components/messages.svelte";
import type { Message } from "@/types";

interface ToolbarProps {
    sendMessage: (message: Message) => void;
}

let {
    sendMessage
}: ToolbarProps = $props();

let prompt: string = $state("");
let searchEnabled: boolean = $state(false);
let thinkEnabled: boolean = $state(false);
let selectedModel: string  = $state("");
const toolbarPlaceholder = $derived( getMessages() ? "How can I help you today?" : "Type your message here...");

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
        content: prompt
    };
    await sendMessage(message);
    // Clear inputs
    prompt = "";
};

const modelOptions: string[] = [
    "Model A",
    "Model B",
    "Model C",
    "Model D",
]

</script>

<div class="bg-background border-solid rounded-lg border-border p-4 drop-shadow-md">
    <div class="flex flex-nowrap justify-center items-center">
        <Textarea
            bind:value={prompt}
            placeholder={toolbarPlaceholder}
            class="flex-1 border-none shadow-none text-base leading-6 resize-none focus-visible:ring-0 placeholder:text-small placeholder:text-muted "
            />
        <div>
            <Button variant="ghost" size="icon">
                <Paperclip/>
            </Button>
            <Button variant="default" size="icon" onclick={completeUserResponse}>
                <ArrowUp />
            </Button>
        </div>
    </div>
       <div class="flex flex-wrap justify-start items-center">
           <DropdownMenu.Root>
             <DropdownMenu.Trigger>
                 <Button variant="outline" size="sm">
                     <p>Model Name</p>
                     <ChevronDown/>
                 </Button>
             </DropdownMenu.Trigger>
             <DropdownMenu.Content class="bg-dropdown">
               <DropdownMenu.Group>
                   {#each modelOptions as model}
                       <DropdownMenu.Item>{model}</DropdownMenu.Item>
                    {/each}
                </DropdownMenu.Group>
             </DropdownMenu.Content>
           </DropdownMenu.Root>
            <Button variant="outline" size="sm" onclick={toggleSearch}>
                <Globe/>
                <p>Search</p>
            </Button>
            <Button variant="outline" size="sm" onclick={toggleThink}>
                <Brain/>
                <p>Think</p>
            </Button>
       </div>
</div>
