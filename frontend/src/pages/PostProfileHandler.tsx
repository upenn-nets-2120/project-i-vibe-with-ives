import React from "react";
// import "./Popup.css";
import { Link, useParams } from "react-router-dom"; // Assuming you are using React Router for navigation

import { useState } from "react";
import axios from "axios";
// import "./App.css";
import PostPopup from "./PostPopup";
import { Post } from "./MyProfile";

const PostGrid = ({ gridPosts }: { gridPosts: Post[] }) => {
  const [isPopupOpen, setPopupOpen] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handleClick = (post: Post) => {
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
      {isPopupOpen && selectedPost && (
        <PostPopup onClick={handleClose} sourcePost={selectedPost} />
      )}

      <div className="profile-posts">
        <div className="post-grid">
          {gridPosts.length == 0 && <h3>No posts to display.</h3>}
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

const PostThumbnail = ({
  post,
  onClick,
}: {
  post: Post;
  onClick: (post: Post) => void;
}) => {
  // default photo?
  if (!post.image) post.image = "https://t4.ftcdn.net/jpg/03/08/43/19/360_F_308431972_g5fuiXwgOZpDCMFQougq13hgSaQVHVro.jpg";

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
const PostProfileHandler = ({ posts }: { posts: Post[] }) => {
  return <PostGrid gridPosts={posts} />;
};

// write renderPopup function to display the image url and any associated title/content in the center of the screen

export default PostProfileHandler;
