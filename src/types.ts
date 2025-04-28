import { EditorView } from "@codemirror/view";
import { Editor, type FrontMatterCache } from "obsidian";

export type Provider = "OpenAI" | "Anthropic" | "Google" | "DeepSeek" | "XAI";

export type CallSettings = {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
    stopSequences?: string[];
    seed?: number;
    maxRetries?: number;
    headers?: Record<string, string | undefined>;
};

export type ChatFrontmatter = CallSettings & {
    // Basic parameters
    title: string;
    tags: FrontMatterCache;

    model?: string;
    stream?: boolean;
    system?: string[];
};

export type ModelConfig = {
    name: string;
    provider: string;
    alias?: string;
};

export type ChatProperty = CallSettings & {
    title: string;
    model?: ModelConfig;
    system?: string[];
};

export enum TextFileExtension {
    MD = "md",
    TXT = "txt",
}

export type TextMessageContent = {
    type: "text";
    text: string;
    originalPath?: string;
    resolvedContent?: (TextMessageContent | ImageMessageContent | DocumentMessageContent)[];
};

export enum ImageExtensionToMimeType {
    PNG = "image/png",
    JPG = "image/jpeg",
    JPEG = "image/jpeg",
    GIF = "image/gif",
}
export type ImageExtension = keyof typeof ImageExtensionToMimeType;

export interface ImageSource {
    type: "base64" | "url";
    media_type?: string;
    data: string;
}

export type ImageMessageContent = {
    type: "image";
    source: ImageSource;
    originalPath?: string;
};

export enum PDFFileExtension {
    PDF = "pdf",
}

export type PDFSource = {
    type: "base64";
    media_type: "application/pdf";
    data: string;
};

export type DocumentMessageContent = {
    type: "document";
    source: PDFSource;
    originalPath?: string;
};

export type MessageContent =
    | string
    | Array<TextMessageContent | ImageMessageContent | DocumentMessageContent>;

export type Message = {
    id?: number;
    role: string;
    content: MessageContent;
};

// Interface for CM6 editor view
export interface EditorWithCM6 extends Editor {
    cm: EditorView;
}
