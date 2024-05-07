import React, { useState } from 'react';

interface Chat {
    id: string;
    name: string;
}

interface Message {
    id: string;
    message: string;
}

interface ChatDisplayProps {
    chat: Chat;
    messages: Message[];
    onSendMessage: (messageText: string, chat: Chat) => void;  // Function to handle sending messages
}

const ChatDisplay: React.FC<ChatDisplayProps> = ({ chat, messages, onSendMessage }) => {
    const [messageText, setMessageText] = useState('');

    const handleSendMessage = () => {
        if (messageText.trim()) {
            onSendMessage(messageText, chat);
            setMessageText('');  // Clear input after sending
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div className="flex-1 bg-gray-200 overflow-y-auto">
            <div className="p-4 bg-blue-500 text-white text-lg">
                {chat.name}
            </div>
            <div className="p-4">
                {messages.map((message) => (
                    <div key={message.id} className="bg-white p-3 my-2 rounded shadow">
                        {message.message}
                    </div>
                ))}
                <div className="flex p-4">
                    <input
                        type="text"
                        className="flex-1 p-2 border rounded focus:outline-none focus:border-blue-500"
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                    <button
                        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={handleSendMessage}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChatDisplay;
