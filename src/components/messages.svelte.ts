import type { Message } from "@/types";

const messages: Message[] = $state([]);

export const pushMessage = (newMessage: Message): void => {
    messages.push(newMessage);
};

export const getMessages = (): Message[] => {
    return messages;
};
