// Home.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import axios from 'axios';
import config from '../../config.json';
import Sidebar from '../components/Sidebar'; // Import the Sidebar component
import CreatePostComponent from '../components/CreatePostComponent';
import PostComponent from '../components/PostComponent';

axios.defaults.withCredentials = true;

export default function Home() {
  const { username } = useParams();
  const rootURL = config.serverRootURL;
  const [posts, setPosts] = useState([]);

  const [searchTerm, setSearchTerm] = useState(""); // Search term state

  const fetchData = async () => {
    try {
      const response = await axios.get(`${rootURL}/${username}/feed`);
      setPosts(response.data.results); // assuming the data is in the results field
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
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

          {posts.map((post) => (
            <PostComponent
              key={post.post_id}
              id={post.post_id}
              user={post.username} // Assuming the user is a property you want to display
              caption={post.caption}
              imageUrl={post.image}
            />
          ))}
        </div>

      </div>
    </div>
  );
}



