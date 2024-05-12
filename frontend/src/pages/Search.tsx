import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import axios from 'axios';
import config from '../../config.json';
import Sidebar from '../components/Sidebar'; 
import PostComponent from '../components/PostComponent';

axios.defaults.withCredentials = true;

const MessageComponent = ({ sender, message }) => {
    return (
        <div className={`w-full flex ${sender === "user" ? "justify-end" : ""}`}>
            <div className={`text-left max-w-[70%] p-3 rounded-md break-words ${sender === "user" ? "bg-blue-100" : "bg-slate-200"}`}>
                {message}
            </div>
        </div>
    );
};

export default function SearchAndChat() {
    const { username } = useParams();
    const rootURL = config.serverRootURL;

    const [posts, setPosts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [messages, setMessages] = useState([
        {
            sender: "chatbot",
            message: "Hi there! How can I assist you today?",
        },
    ]);
    const [input, setInput] = useState('');

    const fetchPosts = async (term) => {
        try {
            const response = await axios.get(`${rootURL}/${username}/searchPosts`, {
                params: { term }
            });
            setPosts(response.data.results);
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        }
    };

    useEffect(() => {
        fetchPosts("");
    }, [username]);

    const handleSearch = () => {
        console.log("Searching for:", searchTerm);
        fetchPosts(searchTerm);
    };

    const sendMessage = async () => {
        setMessages([...messages, { sender: "user", message: input }]);

        try {
            const response = await axios.get(`${rootURL}/${username}/askQuestion`, {
                params: { question: input }
            });
            setMessages([...messages, { sender: "user", message: input }, { sender: "chatbot", message: response.data.answer }]);
        } catch (error) {
            console.error('Error sending message:', error);
        }

        setInput('');
    };

    return (
        <div className="w-screen h-screen flex">
            <Sidebar />
            <div className="flex-1 p-4">
                <div className="mb-4 flex">
                    <input
                        type="text"
                        placeholder="Search posts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: 1, padding: '8px', boxSizing: 'border-box' }}
                    />
                    <button
                        onClick={handleSearch}
                        style={{ padding: '8px 16px', marginLeft: '8px' }}
                    >
                        Search
                    </button>
                </div>
                <div className="mb-8">
                    {posts.length > 0 ? (
                        posts.map((post) => (
                            <PostComponent
                                key={post.post_id}
                                id={post.post_id}
                                user={post.username}
                                caption={post.caption}
                                imageUrl={post.image}
                            />
                        ))
                    ) : (
                        <p>No posts found.</p>
                    )}
                </div>
                <div className="bg-white p-4 rounded shadow-md">
                    <h2 className="text-xl font-bold mb-4">Q&A with LLM</h2>
                    <div className="h-[30rem] overflow-y-scroll mb-4">
                        <div className="space-y-2">
                            {messages.map((msg, index) => (
                                <MessageComponent key={index} sender={msg.sender} message={msg.message} />
                            ))}
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="Ask something!"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    sendMessage();
                                }
                            }}
                            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        <button
                            onClick={sendMessage}
                            style={{ padding: '8px 16px', borderRadius: '4px', background: 'blue', color: 'white' }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}