<script lang="ts">
    import type { WithElementRef, WithoutChildren } from "bits-ui";
    import type { HTMLTextareaAttributes } from "svelte/elements";
    import { cn } from "@/utils.js";
    import { type VariantProps, tv } from "tailwind-variants";
    import type { Action } from "svelte/action";
    import { autoFocus } from "@/utils/actions.svelte";

    export const textAreaVariants = tv({
        base: "",
        variants: {
            variant: {
                default:
                    "flex-1 bg-background border-none shadow-none resize-none outline-none hover:bg-transparent focus-visible:outline-none focus-visible:ring-0 placeholder:text-small placeholder:text-muted",
                inline: "flex-1 bg-background border-none shadow-none resize-none outline-none hover:bg-transparent focus-visible:outline-none focus-visible:ring-0 placeholder:text-small placeholder:text-muted",
            },
            size: {
                default: "min-h-32 w-full text-base max-h-64",
                inline: "min-h-12 w-full text-smaller leading-smaller",
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

    // Auto-resize the textarea based on content
    function adjustHeight() {
        if (ref) {
            // Reset height to calculate scrollHeight properly
            ref.style.height = "auto";
            // Set the height to the scrollHeight to accommodate all content
            ref.style.height = ref.scrollHeight + "px";
        }
    }

    // Initialize height on mount
    $effect.pre(() => {
        if (ref) {
            adjustHeight();
        }
    });

    // Adjust height whenever value changes
    $effect(() => {
        if (value !== undefined) {
            adjustHeight();
        }
    });
</script>

<textarea
    bind:this={ref}
    bind:value
    class={cn(textAreaVariants({ variant, size }), className)}
    oninput={adjustHeight}
    use:autoFocus
    {...restProps}
></textarea>
