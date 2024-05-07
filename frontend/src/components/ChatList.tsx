import React from 'react';

interface Chat {
    id: string;
    name: string;
}

interface ChatListProps {
    chats: Chat[];
    onSelectChat: (chat: Chat) => void;
}

function ChatList({ chats, onSelectChat }: ChatListProps) {
    return (
        <div className="w-64 h-screen overflow-y-auto bg-gray-100 border-r">
            {chats.map(chat => (
                <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat)}
                    className="p-4 hover:bg-blue-100 cursor-pointer transition duration-300 ease-in-out border-b border-gray-300"
                >
                    {chat.name}
                </div>
            ))}
        </div>
    );
}

export default ChatList;
