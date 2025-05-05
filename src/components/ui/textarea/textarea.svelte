<script lang="ts">
    import type { WithElementRef, WithoutChildren } from "bits-ui";
    import type { HTMLTextareaAttributes } from "svelte/elements";
    import { cn } from "@/utils.js";
    import { type VariantProps, tv } from "tailwind-variants";

    export const textAreaVariants = tv({
        base: "",
        variants: {
            variant: {
                default:
                    "flex-1 bg-background border-none shadow-none leading-6 resize-none outline-none hover:bg-transparent focus-visible:outline-none focus-visible:ring-0 placeholder:text-small placeholder:text-muted",
                inline: "flex-1 bg-background border-none shadow-none leading-6 resize-none outline-none hover:bg-transparent focus-visible:outline-none focus-visible:ring-0 placeholder:text-small placeholder:text-muted",
            },
            size: {
                default: "min-h-20 w-full text-base",
                inline: "min-h-20 w-full text-small",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    });
    type TextareaVariant = VariantProps<typeof textAreaVariants>["variant"];
    type TextareaSize = VariantProps<typeof textAreaVariants>["size"];

    let {
        ref = $bindable(null),
        value = $bindable(),
        class: className,
        variant = "default",
        size = "default",
        ...restProps
    }: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> & {
        variant?: TextareaVariant;
        size?: TextareaSize;
    } = $props();
</script>

<textarea
    bind:this={ref}
    bind:value
    class={cn(textAreaVariants({ variant, size }), className)}
    {...restProps}
></textarea>
