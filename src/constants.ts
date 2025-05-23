export const PLUGIN_NAME = "Cerebro";

export const CEREBRO_LUCIDE_ICON = "brain-circuit";

export const YAML_FRONTMATTER_REGEX = /^---\s*[\s\S]*?\s*---/g;

export const ERROR_NOTICE_TIMEOUT_MILLISECONDS = 10000;

export const MAX_DOCUMENT_DEPTH = 2; // Maximum depth of document resolution

// Cerebro plugin messages
export enum CerebroMessages {
    CALLING_API = "[Cerebro] Calling API",
    INFER_TITLE_UNKNOWN_FAILURE = "[Cerebro] Title unable to be inferred",
    UPDATING_PROPERTIES = "[Cerebro] Updating files accessed",
    EMPTY = "",
}

export const userHeader = (username: string, headingLevel: number): string => {
    return `<h${headingLevel} class="${CSSAssets.HEADER}">${username}</h${headingLevel}>`;
};

export const assistantHeader = (assistantName: string, headingLevel: number): string => {
    return `<h${headingLevel} class="${CSSAssets.HEADER}">${assistantName}</h${headingLevel}>`;
};

export enum CSSAssets {
    HR = "__crb-hr",
    HEADER = "__crb-header",
}
