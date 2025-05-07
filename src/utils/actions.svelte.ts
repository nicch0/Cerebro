import type { Action } from "svelte/action";

export const autoFocus: Action = (node) => {
    $effect(() => {
        node.focus();
        return () => {};
    });
};
