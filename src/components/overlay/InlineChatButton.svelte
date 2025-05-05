<script lang="ts">
    import { Plus } from "@lucide/svelte";
    import Button from "../ui/button/button.svelte";

    let { onclick } = $props();
</script>

<Button variant="default" size="icon" {onclick}>
    <Plus class="size-4" />
</Button>
