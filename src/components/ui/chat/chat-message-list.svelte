<script lang="ts">
    import type { DivableProps } from "../../../types.js";
    import { ArrowDown } from "@lucide/svelte";
    import autoscroll from "./hooks/use_autoscroll.svelte";
    type ChatMessageListProps = DivableProps & {
        smooth?: boolean;
    };
    let {
        class: className,
        smooth = false,
        ref = $bindable(null),
        children,
        ...restProps
    }: ChatMessageListProps = $props();
</script>

<div class="relative h-full w-full">
    <div
        bind:this={ref}
        use:autoscroll={{ pauseOnUserScroll: true, behavior: smooth ? "smooth" : "auto" }}
        class={["flex h-full w-full flex-col overflow-y-auto overflow-x-hidden p-4", className]}
        {...restProps}
    >
        <div class="flex flex-col gap-4">
            {@render children?.()}
        </div>
    </div>
</div>
