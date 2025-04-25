import type { Message } from "@/types";

// const messages: Message[] = $state([]);

// export const pushMessage = (newMessage: Message): void => {
//     messages.push(newMessage);
// };

// export const getMessages = (): Message[] => {
//     return messages;
// };
//
export type MessageStore = {
    messages: Message[];
    push: (newMessage: Message) => number;
};

export function createMessageStore(): MessageStore {
    const messages: Message[] = $state([]);

    return {
        get messages(): Message[] {
            return messages;
        },
        push: (newMessage: Message): number => messages.push(newMessage),
    };
}
