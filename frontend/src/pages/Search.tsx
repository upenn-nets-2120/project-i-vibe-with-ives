import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import axios from 'axios';
import config from '../../config.json';
import Sidebar from '../components/Sidebar'; 
import PostComponent from '../components/PostComponent';

axios.defaults.withCredentials = true;

interface Message {
    sender: string;
    message: string;
}

interface Post {
    post_id: string;
    username: string;
    caption: string;
    image: string;
}

const MessageComponent: React.FC<{ sender: string, message: string }> = ({ sender, message }) => {
    return (
        <div className={`w-full flex ${sender === "user" ? "justify-end" : ""}`}>
            <div className={`text-left max-w-[70%] p-3 rounded-md break-words ${sender === "user" ? "bg-blue-100" : "bg-slate-200"}`}>
                {message}
            </div>
        </div>
    );
};

export default function SearchAndChat() {
    const { username } = useParams<{ username: string }>();
    const rootURL = config.serverRootURL;

    const [posts, setPosts] = useState<Post[]>([]);
    const [messages, setMessages] = useState<Message[]>([
        {
            sender: "chatbot",
            message: "Hi there! How can I assist you today?",
        },
    ]);
    const [input, setInput] = useState<string>('');

    const fetchPosts = async (term: string) => {
        try {
            console.log("Searching for:", term);
            const response = await axios.get(`${rootURL}/${username}/searchPosts`, {
                params: { question : term }
            });
            console.log(response.data.answer);
            setPosts(response.data.answer.slice(0, 5)); // Limiting to top 5 posts
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        }
    };

    useEffect(() => {
        fetchPosts("");
    }, [username]);

    const sendMessage = async () => {
        setMessages([...messages, { sender: "user", message: input }]);

        try {
            console.log("Sending question:", input);
            const response = await axios.get(`${rootURL}/${username}/askQuestion`, {
                params: { question: input }
            });
            console.log("Response:", response.data.answer);
            setMessages((prevMessages) => [
                ...prevMessages,
                { sender: "user", message: input },
                { sender: "chatbot", message: response.data.answer }
            ]);

            fetchPosts(input);

        } catch (error) {
            console.error('Error sending message:', error);
        }

        setInput('');
    };

    return (
        <div className="w-screen h-screen flex">
            <Sidebar />
            <div className="flex-1 p-4">
                <div className="bg-white p-4 rounded shadow-md mb-4">
                    <h2 className="text-xl font-bold mb-4">Ask a Question</h2>
                    <div className="flex space-x-2 mb-4">
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
                    <div className="h-[10rem] overflow-y-scroll mb-4 bg-gray-100 p-2 rounded">
                        <h3 className="text-lg font-bold mb-2">LLM Response</h3>
                        <div className="space-y-2">
                            {messages.filter(msg => msg.sender === "chatbot").map((msg, index) => (
                                <MessageComponent key={index} sender={msg.sender} message={msg.message} />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded shadow-md">
                    <h2 className="text-xl font-bold mb-4">Related Posts</h2>
                    <div className="space-y-4">
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
                </div>
            </div>
        </div>
    );
}