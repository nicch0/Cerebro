import type { Message } from "@/types";

const messages: Message[] = $state([]);

export const pushMessage = (newMessage: Message) => {
    messages.push(newMessage);
};

export const getMessages = () => {
    return messages;
};
