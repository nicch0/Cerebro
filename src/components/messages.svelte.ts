import type { Message, MessageContent } from "@/types";

export type MessageStore = {
    messages: Message[];
    push: (role: string, content: MessageContent) => Message;
};

export function createMessageStore(): MessageStore {
    const messages: Message[] = $state([]);
    let nextId: number = $state(0);

    return {
        get messages(): Message[] {
            return messages;
        },
        push: (role: string, content: MessageContent): Message => {
            const msg = { id: nextId, role, content } satisfies Message;
            messages.push(msg);
            nextId += 1;
            return msg;
        },
    };
}
