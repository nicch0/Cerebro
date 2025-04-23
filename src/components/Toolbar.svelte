<script lang="ts">
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import * as DropdownMenu from "@/components/ui/dropdown-menu";
import { Paperclip, ArrowUp, Globe, Brain } from "@lucide/svelte";

</script>

<h1 class="underline">Toolbar</h1>
<div class="bg-background border-solid rounded-lg border-border p-4 shadow-md">

    <div class="flex flex-nowrap justify-center items-center">
        <Textarea
            placeholder="How can I help you today?"
            class="flex-1 border-none shadow-none text-base leading-6 resize-none focus-visible:ring-0 placeholder:text-base placeholder:text-muted "
            />
        <div>
            <Button variant="ghost" size="icon">
                <Paperclip/>
            </Button>
            <Button variant="default" size="icon">
                <ArrowUp />
            </Button>
        </div>
    </div>
       <div class="flex flex-wrap justify-start items-center text-normal">
           <DropdownMenu.Root>
             <DropdownMenu.Trigger>Model Name</DropdownMenu.Trigger>
             <DropdownMenu.Content>
               <DropdownMenu.Group>
                 <!-- Each model -->
                 <DropdownMenu.Item>Model A</DropdownMenu.Item>
                 <DropdownMenu.Item>Model B</DropdownMenu.Item>
                 <DropdownMenu.Item>Model C</DropdownMenu.Item>
                 <DropdownMenu.Item>Model D</DropdownMenu.Item>
               </DropdownMenu.Group>
             </DropdownMenu.Content>
           </DropdownMenu.Root>
            <Button variant="outline" size="sm">
                <Globe/>
                <p>Search</p>
            </Button>
            <Button variant="outline" size="sm">
                <Brain/>
                <p>Think</p>
            </Button>
       </div>
</div>
