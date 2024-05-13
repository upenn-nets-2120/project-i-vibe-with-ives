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
        <div className="w-64 overflow-y-auto bg-gray-100 border-r">
            {chats && chats.length > 0 ? (chats.map(chat => (
                <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat)}
                    className="min-w-[160px] h-20 flex items-center justify-center p-4 hover:bg-blue-100 cursor-pointer transition duration-300 ease-in-out border-r border-gray-300"
                >
                    {chat.name}
                </div>
            ))) : (<p className="text-center text-gray-500">No chats available</p>)}
        </div>
    );
}

export default ChatList;
