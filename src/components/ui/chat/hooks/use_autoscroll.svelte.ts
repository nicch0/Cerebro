type AutoscrollOptions = {
    pauseOnUserScroll?: boolean;
};

export default function autoscroll(
    node: HTMLElement,
    options: AutoscrollOptions & ScrollOptions = {
        behavior: "smooth",
    },
): {
    update({ pauseOnUserScroll, behavior }: AutoscrollOptions & ScrollOptions): void;
    destroy(): void;
} {
    const forbiddenOverflows = ["visible", "hidden"];
    if (
        forbiddenOverflows.includes(getComputedStyle(node).overflowX) &&
        forbiddenOverflows.includes(getComputedStyle(node).overflowY)
    ) {
        console.warn(
            "Autoscroll element will never scroll. Set at least one of `overflow-x` or `overflow-y` to either `auto` or `scroll`.",
        );
    }
    const { pauseOnUserScroll: _, ...scrollOptions } = {
        behavior: "smooth",
        ...options,
    };
    const scroll = (): void => {
        node.scrollTo({
            top: node.scrollHeight,
            left: 0,
            ...scrollOptions,
        } as ScrollToOptions);
    };
    // for when children change sizes
    const resizeObserver = new ResizeObserver(() => {
        // Only auto-scroll if we're already at the bottom (within a small threshold)
        const isAtBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 10;
        if (isAtBottom) {
            scroll();
        }
    });
    // for when children are added or removed/subtree changes
    const mutationObserver = new MutationObserver(() => {
        // Always scroll when messages are added - this is for new messages
        // For chat applications, we usually want scrolling when content is added
        scroll();
    });
    const observeAll = () => {
        // observe size of all children
        for (const child of node.children) {
            resizeObserver.observe(child);
        }
        mutationObserver.observe(node, { childList: true, subtree: true });
    };
    observeAll();
    const handleScroll = () => {
        if (node.scrollTop + node.clientHeight < node.scrollHeight) {
            mutationObserver.disconnect();
            resizeObserver.disconnect();
        } else {
            observeAll();
        }
    };
    if (options.pauseOnUserScroll) {
        node.addEventListener("scroll", handleScroll);
    }
    return {
        update({ pauseOnUserScroll, behaviour }): void {
            if (pauseOnUserScroll) {
                node.addEventListener("scroll", handleScroll);
                mutationObserver.disconnect();
                resizeObserver.disconnect();
            } else {
                node.removeEventListener("scroll", handleScroll);
                observeAll();
            }
        },
        destroy(): void {
            if (mutationObserver) {
                mutationObserver.disconnect();
            }
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            if (options.pauseOnUserScroll) {
                node.removeEventListener("scroll", handleScroll);
            }
        },
    };
}
