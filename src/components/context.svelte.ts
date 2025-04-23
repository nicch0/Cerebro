const messages: string[] = $state(["What would Munger do?","Well, he certainly wouldn't give up!"]);

export const pushMessage = (newMessage: string) => {
    messages.push(newMessage);
    console.log(messages);
};

export const getMessages = () => {
    return messages;
};
