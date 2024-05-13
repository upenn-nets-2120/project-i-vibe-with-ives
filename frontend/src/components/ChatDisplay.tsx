import React, { useState } from 'react';
import ChatPopup from "../pages/ChatPopup";
import axios from 'axios';
import { useParams } from "react-router-dom";
import config from '../../config.json';

interface Chat {
    id: string;
    name: string;
}

interface Message {
    username: string;
    message: string;
    timestamp: Date;
}

interface ChatDisplayProps {
    chat: Chat;
    messages: Message[];
    onSendMessage: (messageText: string, chat: Chat) => void;  // Function to handle sending messages
    fetchChats: () => void;  // Function to fetch chats
    setSelectedChat: (chat: Chat | null) => void;  // Function to set the selected chat
    currentUser: string | undefined;
}

const MessageComponent = ({
    sender,
    message,
    currentUser
}: {
    sender: string;
    message: string;
    currentUser: string | undefined;
}) => {
    return (
        <div className={`w-full flex ${sender === currentUser ? "justify-end" : "justify-start"}`}>
            <div className={`text-left max-w-[70%] p-3 rounded-md break-words ${sender === currentUser ? "bg-blue-100" : "bg-slate-200"}`}>
                <div className="text-xs text-black font-light mb-1">{sender}</div>
                {message}
            </div>
        </div>
    );
};

const ChatDisplay: React.FC<ChatDisplayProps> = ({ chat, messages, onSendMessage, fetchChats, setSelectedChat, currentUser }) => {
    const [messageText, setMessageText] = useState('');
    const [showPop, setShowPop] = useState<boolean>(false);
    const [isFriends, setIsFriends] = useState<boolean>(false);
    const rootURL = config.serverRootURL;
    const { username } = useParams();

    const togglePop = () => {
        setShowPop(!showPop);
        setIsFriends(true);
    };

    console.log(currentUser);
    console.log(messages);
    const handleSendMessage = () => {
        if (messageText.trim()) {
            onSendMessage(messageText, chat);
            setMessageText('');  // Clear input after sending
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            handleSendMessage();
            event.preventDefault();
        }
    };

    const handleLeave = async () => {
        try {
            await axios.post(`${rootURL}/${username}/leaveChat`, {
                chat_name: chat.name,
                username: currentUser,
            });
            // Assume fetchChats and setSelectedChat are passed down as props
            fetchChats();         // Refresh the list of chats
            setSelectedChat(null); // Clear the current chat display
        } catch (error) {
            console.error("Failed to leave chat:", error);
        }
    };


    return (
        <div className="flex-1 bg-gray-200 overflow-y-auto">
            <div className="flex justify-between items-center p-4 bg-blue-500 text-white text-lg">
                <span>{chat.name}</span>
                <div>
                    <button onClick={togglePop} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mr-2">
                        Invite Friends
                    </button>
                    <button onClick={handleLeave} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                        Leave
                    </button>
                </div>
            </div>
            <div className="p-4">
                {messages.map((message) => {
                    return (
                        <MessageComponent sender={message.username} message={message.message} currentUser={currentUser} />
                    );
                })}
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
                {showPop && <ChatPopup
                    show={showPop}
                    handleClose={togglePop}
                    isFriends={isFriends}
                    activeUser={username ? username : ''}
                    currentChat={chat ? chat.name : ''}
                />}
            </div>
        </div>
    );
}

export default ChatDisplay;
