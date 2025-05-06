<script lang="ts" module>
    import type { WithElementRef } from "bits-ui";
    import type { SvelteHTMLElements } from "svelte/elements";
    import { type VariantProps, tv } from "tailwind-variants";
    import MessageLoading from "../message-loading.svelte";

    export const chatBubbleMessageVariants = tv({
        base: "select-text",
        variants: {
            variant: {
                // TODO: Add fallback values in case bg-primary-alt is not set
                received: "bg-primary rounded-xl rounded-bl-none",
                sent: "bg-primary-alt rounded-xl rounded-tr-none",
            },
            layout: {
                default: "border-t w-full p-4 leading-normal text-primary",
                inline: "border-t w-full p-0 leading-smaller text-smaller",
            },
        },
        defaultVariants: {
            variant: "received",
            layout: "default",
        },
    });

    type ChatBubbleMessageVariant = VariantProps<typeof chatBubbleMessageVariants>["variant"];
    type ChatBubbleMessageLayout = VariantProps<typeof chatBubbleMessageVariants>["layout"];

    export type ChatBubbleMessageProps = WithElementRef<SvelteHTMLElements["div"]> & {
        variant?: ChatBubbleMessageVariant;
        layout?: ChatBubbleMessageLayout;
        isLoading?: boolean;
    };
</script>

<script lang="ts">
    let {
        class: className,
        variant,
        layout,
        ref = $bindable(null),
        isLoading = false,
        children,
        ...restProps
    }: ChatBubbleMessageProps = $props();
</script>

<div
    bind:this={ref}
    class={[chatBubbleMessageVariants({ variant, layout }), className]}
    {...restProps}
>
    {#if isLoading}
        <div class="flex items-center space-x-2">
            <MessageLoading />
        </div>
    {:else}
        {@render children?.()}
    {/if}
</div>
