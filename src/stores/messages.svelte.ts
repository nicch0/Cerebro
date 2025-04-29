import type { Message, MessageContent } from "@/types";

export const createMessageStore = () => {
    let messages: Message[] = $state([]);
    let nextId: number = $state(0);

    return {
        get messages(): Message[] {
            return messages;
        },
        addMessage: (role: string, content: MessageContent): Message => {
            const msg = { id: nextId, role, content } satisfies Message;
            messages.push(msg);
            nextId += 1;
            return msg;
        },
        clearMessages: (): void => {
            messages = [];
        },
    };
};

export type MessageStore = ReturnType<typeof createMessageStore>;
