<script lang="ts">
    import { Notice } from "obsidian";
    import { Plus } from "@lucide/svelte";
    import Button from "../ui/button/button.svelte";

    const onclick = () => {
        new Notice("Hello world");
    };
</script>

<Button variant="default" size="icon" {onclick}>
    <Plus class="size-4" />
</Button>
