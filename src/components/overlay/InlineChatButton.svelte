<script lang="ts">
    import { BrainCircuit } from "@lucide/svelte";
    import Button from "../ui/button/button.svelte";

    let { onclick } = $props();
</script>

<Button variant="default" size="icon" {onclick}>
    <BrainCircuit class="size-4" />
</Button>
