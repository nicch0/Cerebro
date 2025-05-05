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
                default: "h-20 w-full text-base",
                inline: "h-20 w-full text-small",
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

<!-- class={cn(
    "border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[60px] w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-0 md:text-sm",
    className,
)} -->
<textarea
    bind:this={ref}
    bind:value
    class={cn(textAreaVariants({ variant, size }), className)}
    {...restProps}
></textarea>
