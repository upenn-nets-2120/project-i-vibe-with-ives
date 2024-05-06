import React from "react";
import "./Popup.css";
import { Link } from "react-router-dom"; // Assuming you are using React Router for navigation
import { useState } from "react";
import axios from "axios";
import "./App.css";
import PostPopup from "./PostPopup";

const PostGrid = ({ gridPosts, username }) => {
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const handleClick = (post) => {
    setSelectedPost(post);
    console.log(post);
    setPopupOpen(true);
  };

  const handleClose = () => {
    setPopupOpen(false);
    setSelectedPost(null);
  };

  return (
    <div>
      {isPopupOpen && (
        <PostPopup
          onClick={handleClose}
          sourcePost={selectedPost}
          username={username}
        />
      )}

      <div className="profile-posts">
        <div className="post-grid">
          {gridPosts.map((post) => (
            <PostThumbnail
              key={post.post_id}
              post={post}
              onClick={handleClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const PostThumbnail = ({ post, onClick }) => {
  return (
    <img
      src={post.image}
      alt="Post"
      className="post-thumbnail"
      onClick={() => onClick(post)}
    />
  );
};

// PostThumbnail component
const PostProfileHandler = ({ posts, username, loggedIn }) => {
  return <PostGrid gridPosts={posts} username={username} />;
};

// write renderPopup function to display the image url and any associated title/content in the center of the screen

export default PostProfileHandler;
