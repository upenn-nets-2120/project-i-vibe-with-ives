// Home.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import axios from 'axios';
import config from '../../config.json';
import Sidebar from '../components/Sidebar'; // Import the Sidebar component
import CreatePostComponent from '../components/CreatePostComponent';

export default function Home() {
  const { username } = useParams();
  const rootURL = config.serverRootURL;
  const [posts, setPosts] = useState([]);

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

  return (
    <div className="w-screen h-screen flex">
      <Sidebar /> {/* Use the Sidebar component */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Content area where posts and other components will be rendered */}
        <CreatePostComponent updatePosts={updatePosts} />
        {/* {posts.map((post: { id: number, title: string }) => (
          <div key={post.id}>{post.title}</div>
        ))} */}
      </div>
    </div>
  );
}



