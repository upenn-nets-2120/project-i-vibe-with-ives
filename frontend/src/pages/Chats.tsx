import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import axios from 'axios';
import config from '../../config.json';
import Sidebar from '../components/Sidebar';
import ChatList from '../components/ChatList';
import ChatDisplay from '../components/ChatDisplay';
import ChatPopup from "../pages/ChatPopup";

// Define interfaces for your data structures
interface Chat {
    id: string;
    name: string;
}

interface Message {
    username: string;
    message: string;
    timestamp: Date;
}

axios.defaults.withCredentials = true;

export default function Chats() {
    const { username } = useParams();
    const rootURL = config.serverRootURL;

    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [showPop, setShowPop] = useState<boolean>(false);
    const [isFriends, setIsFriends] = useState<boolean>(false);

    const toggleFriends = () => {
        setShowPop(!showPop);
        setIsFriends(true);
    };

    const fetchChats = async () => {
        try {
            const response = await axios.get(`${rootURL}/${username}/chats`, {
                params: { username } // Pass username as a query parameter
            });
            setChats(response.data.results);
        } catch (error) {
            console.error('Error fetching chats:', error);
        }
    };

    const fetchMessages = async () => {
        if (selectedChat) {
            try {
                const response = await axios.get(`${rootURL}/${username}/messages`, {
                    params: { username: username, chat_name: selectedChat.name } // Pass chat_name as a query parameter
                });
                setMessages(response.data.results);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        }
    };

    useEffect(() => {
        fetchChats();
    }, [username]);

    useEffect(() => {
        fetchMessages();
    }, [selectedChat]);

    const sendMessage = async (messageText: string, selectedChat: Chat) => {
        try {
            await axios.post(`${rootURL}/${username}/sendMessage`, {
                username: username,
                message: messageText,
                chat_name: selectedChat.name,
            });
            fetchMessages(); // Refresh messages after sending
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleCreateChat = () => {
        // Implement logic to handle creating a new chat
        console.log('Creating new chat...');
        setIsCreatingChat(true);
        // Additional logic to actually create the chat would go here
    };

    return (
        <div className="w-screen h-screen flex">
            <Sidebar />
            <div className="flex flex-col">
                <button onClick={toggleFriends} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Create Chat
                </button>
                <ChatList chats={chats} onSelectChat={setSelectedChat} />
            </div>
            {selectedChat && (
                <ChatDisplay
                    chat={selectedChat}
                    messages={messages}
                    onSendMessage={sendMessage}
                    fetchChats={fetchChats}
                    setSelectedChat={setSelectedChat}
                    currentUser={username}  // Pass the sendMessage function to ChatDisplay
                />
            )}
            {showPop && <ChatPopup
                show={showPop}
                handleClose={toggleFriends}
                isFriends={isFriends}
                activeUser={username ? username : ''}
            />}
        </div>
    );
}
