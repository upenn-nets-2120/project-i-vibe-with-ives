import React, { useEffect } from "react";
import "./App.css";
import "./Profile.css";
import ListPopup from "./ListPopup";
import PostProfileHandler from "./PostProfileHandler";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

// usestate import
import { useState } from "react";

const MyProfile = ({ loggedIn }) => {
  // const { username, name, actor, posts } = props;
  const [profile, setProfile] = useState({
    user_id: 10,
    username: "agshruti",
    hashed_password: "dummy",
    first_name: "dummy",
    last_name: "dummy",
    affiliation: "dummy",
    linked_nconst: "nm0000122",
    birthday: null,
    email: null,
    selfie: null,
  });
  const [posts, setPosts] = useState([
    {
      post_id: 2,
      parent_post: null,
      title: "dummy 1",
      content: "abc",
      author_id: 5,
      depth: null,
      image: null,
    },
    {
      post_id: 3,
      parent_post: null,
      title: "dummy 2",
      content: "qwer",
      author_id: 5,
      depth: null,
      image: null,
    },
  ]);

  const fetchData = async () => {
    const username = loggedIn;

    const response = await axios.get(
      `http://localhost:8080/${username}/getProfile`
    );
    setProfile(response.data.result);

    const response2 = await axios.get(
      `http://localhost:8080/${username}/getPosts`
    );
    setPosts(response2.data.result);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // const [postGrid, setPostGrid] = useState(posts);

  // LOGGED IN USER
  // settings pop out
  // posts
  // username
  // actor bio
  // friends
  // recommendations

  const [showPop, setShowPop] = useState(false);
  const [isFriends, setIsFriends] = useState(false);

  const toggleFriends = () => {
    setShowPop(!showPop);
    setIsFriends(true);
  };

  const toggleRecommendations = () => {
    setShowPop(!showPop);
    setIsFriends(false);
  };

  return (
    <div className="profile-container">
      <div className="profile-top">
        <div className="profile-picture">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcVxC8L9WXWSVzQAshqEzQKvF0kl8vTiZoYANDEZRdDQ&s"
            alt="Profile"
          />
        </div>
        <div className="profile-info">
          <h2>@ {profile.username}</h2>
          <p>
            {profile.first_name} {profile.last_name} is now linked to
            {profile.affiliation}
          </p>
          <div className="profile-buttons">
            <button onClick={toggleFriends} class="btn btn-success">
              Friends
            </button>
            <button onClick={toggleRecommendations} class="btn btn-success">
              Recommendations
            </button>
            <button class="btn btn-success">Edit Profile</button>
            <ListPopup
              show={showPop}
              handleClose={toggleFriends}
              isFriends={isFriends}
              username={profile.username}
            />
          </div>
        </div>
      </div>
      <div>
        <PostProfileHandler posts={posts} username={profile.username} />
      </div>
    </div>
  );
};

export default MyProfile;
