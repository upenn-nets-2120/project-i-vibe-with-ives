// Home.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import axios from 'axios';
import config from '../../config.json';
import Sidebar from '../components/Sidebar'; // Import the Sidebar component
import CreatePostComponent from '../components/CreatePostComponent';
import PostComponent from '../components/PostComponent';
import { Box, Drawer, AppBar, Toolbar, Typography, InputBase, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';


export default function Home() {
  const { username } = useParams();
  const rootURL = config.serverRootURL;
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // Search term state

  const fetchData = async () => {
    const response = await axios.get(`${rootURL}/${username}/feed`);
    setPosts(response.data.results);
  };

  const updatePosts = () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [username]);

  const handleSearch = () => {
    // For now, just logs the search term
    console.log("Searching for:", searchTerm);
    // Here you might want to filter posts or fetch based on the search
  };
  return (
    <div className="w-screen h-screen flex">
      <Sidebar /> {/* Use the Sidebar component */}
      <div style={{ flex: 1, overflowY: "auto", position: 'relative' }}>
        {/* Content area where posts and other components will be rendered */}
        <div style={{ position: 'absolute', top: 100, right: -500 }}>

          <CreatePostComponent updatePosts={updatePosts} />
        </div>
        {/* Search Bar */}
        <div style={{ width: '100%', padding: '10px' }}>
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px', margin: '10px 0', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '20px' }}>

          <PostComponent title={"placeholder"} user={"zora"} description={"dog"} imageUrl={'../../golden-retriever-personality-1024x739.jpeg'} />
          <PostComponent title={"placeholder"} user={"zora"} description={"dog"} imageUrl={'../../golden-retriever-personality-1024x739.jpeg'} />

          {/* {posts.map((post: { id: number, title: string }) => (
          <div key={post.id}>{post.title}</div>
        ))} */}
        </div>

      </div>
    </div>
  );
}



