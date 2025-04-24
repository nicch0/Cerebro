import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const config = {
    preprocess: vitePreprocess({ script: true }),
    compilerOptions: {
        runes: true,
    },
};

export default config;
