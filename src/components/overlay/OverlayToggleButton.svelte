<script lang="ts">
    import { BrainCircuit } from "@lucide/svelte";
    type Props = {
        toggleActive: () => void;
        data: { active: boolean };
    };

    let { data, toggleActive }: Props = $props();
</script>

<button
    aria-label="Toggle Cerebro Overlay"
    class={[
        "cerebro-overlay-button",
        "clickable-icon",
        "view-action",
        data.active && ["pinned", "button-active"],
    ]}
    variant="outline"
    size="default"
    onclick={toggleActive}
>
    <BrainCircuit class="size-4" />
</button>
