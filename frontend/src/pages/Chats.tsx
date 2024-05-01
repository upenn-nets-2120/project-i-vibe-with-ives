import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import axios from 'axios';
import config from '../../config.json';
import Sidebar from '../components/Sidebar'; // Import the Sidebar component

export default function Chats() {
    const { username } = useParams();
    const rootURL = config.serverRootURL;
    const [posts, setPosts] = useState([]);

    const fetchData = async () => {
        const response = await axios.get(`${rootURL}/${username}/feed`);
        setPosts(response.data.results);
    };

    useEffect(() => {
        fetchData();
    }, [username]);

    return (
        <div className="w-screen h-screen flex">
            <Sidebar /> {/* Use the Sidebar component */}
            <div style={{ flex: 1, overflowY: "auto" }}>
                {/* Content area where posts and other components will be rendered */}
            </div>
        </div>
    );
}