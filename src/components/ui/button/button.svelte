<script lang="ts" module>
    import type { WithElementRef } from "bits-ui";
    import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
    import { type VariantProps, tv } from "tailwind-variants";

    export const buttonVariants = tv({
        base: "clickable-icon focus-visible:ring-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        variants: {
            variant: {
                default:
                    "bg-interactive-accent text-on-accent hover:bg-opacity-100 hover:bg-interactive-accent-hover hover:text-on-accent shadow",
                ghost: "bg-transparent text-faint clickable-icon hover:bg-opacity-100 hover:text-normal hover:bg-transparent outline-none focus-visible:outline-none focus-visible:text-normal focus-visible:ring-0",
                secondary: "bg-secondary text-muted shadow-sm hover:bg-interactive-hover shadow",
                outline:
                    "border-input bg-background hover:bg-accent hover:text-accent-foreground border",
                // Defaults
                destructive: "bg-modifier-error text-normal hover:bg-destructive/90 shadow-sm",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-10 rounded-md px-8",
                icon: "h-9 w-9 p-4",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    });

    export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
    export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

    export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
        WithElementRef<HTMLAnchorAttributes> & {
            variant?: ButtonVariant;
            size?: ButtonSize;
        };
</script>

<script lang="ts">
    import { cn } from "@/utils.js";

    let {
        class: className,
        variant = "default",
        size = "default",
        ref = $bindable(null),
        href = undefined,
        type = "button",
        children,
        ...restProps
    }: ButtonProps = $props();
</script>

{#if href}
    <a
        bind:this={ref}
        class={cn(buttonVariants({ variant, size }), className)}
        {href}
        {...restProps}
    >
        {@render children?.()}
    </a>
{:else}
    <button
        bind:this={ref}
        class={cn(buttonVariants({ variant, size }), className)}
        {type}
        {...restProps}
    >
        {@render children?.()}
    </button>
{/if}
