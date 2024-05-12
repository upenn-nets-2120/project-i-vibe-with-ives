// Home.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import axios from 'axios';
import config from '../../config.json';
import Sidebar from '../components/Sidebar'; // Import the Sidebar component
import CreatePostComponent from '../components/CreatePostComponent';
import PostComponent from '../components/PostComponent';
import FriendRecsComponent from '../components/FriendRecsComponent';
import "./Home.css"

axios.defaults.withCredentials = true;

export default function Home() {
  const { username } = useParams();
  const rootURL = config.serverRootURL;
  const [posts, setPosts] = useState([]);

  const [searchTerm, setSearchTerm] = useState(""); // Search term state
  const [showPop, setShowPop] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${rootURL}/${username}/feed`);
      setPosts(response.data.results); // assuming the data is in the results field
    } catch (error) {
      alert("Failed to fetch posts");
      console.error("Failed to fetch posts:", error);
    }
  };

  const toggleCreate = () => {
    setShowPop(!showPop);
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
    <div className="home-container">
      <Sidebar /> {/* Use the Sidebar component */}
      <div className="content-area">
        {/* Content area where posts and other components will be rendered */}
        {/* Search Bar */}
        <div className='search-bar'>
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '8px', margin: '10px 0', boxSizing: 'border-box' }}
          />
        </div>
        <div className="posts-container">
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
        
        <div className="sidebar-right">
          <button onClick={toggleCreate} className="create-post-button btn btn-primary">
                  Create Post
          </button>
          {showPop && <CreatePostComponent show={showPop} handleClose={toggleCreate} updatePosts={fetchData} />}
          <FriendRecsComponent />
        </div>

      </div>
    </div>
  );
}



