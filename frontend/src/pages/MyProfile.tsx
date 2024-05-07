import React, { useEffect } from "react";
// import "./App.css";
import "./Profile.css";
import ListPopup from "./ListPopup";
import PostProfileHandler from "./PostProfileHandler";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import config from '../../config.json';
import Sidebar from '../components/Sidebar';

// usestate import
import { useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';

export interface Profile {
  user_id: number;
  username: string;
  hashed_password: string;
  first_name: string;
  last_name: string;
  affiliation: string;
  linked_nconst: string;
  birthday: Date | null;
  email: string | null;
  selfie: string | null;
}

export interface Post {
  post_id: number;
  parent_post: number | null;
  caption: string | null;
  author_id: number;
  image: string | null;
  num_likes: number | null;
}

const MyProfile = () => {
  // const { username, name, actor, posts } = props;
  const navigate = useNavigate();
  const { username } = useParams();
  const rootURL = config.serverRootURL;
  const [profile, setProfile] = useState<Profile>({
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
  const [posts, setPosts] = useState<Post[]>([
    {
      post_id: 2,
      parent_post: null,
      caption: "dummy 1",
      author_id: 5,
      image: null,
      num_likes: null,
    },
    {
      post_id: 3,
      parent_post: null,
      caption: "dummy 2",
      author_id: 5,
      image: null,
      num_likes: null,
    },
  ]);

  const fetchData = async () => {
    const response = await axios.get(
      `${rootURL}/${username}/getProfile`
    );
    setProfile(response.data.result);

    const response2 = await axios.get(
      `${rootURL}/${username}/getPosts`
    );
    setPosts(response2.data.result);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [showPop, setShowPop] = useState<boolean>(false);
  const [isFriends, setIsFriends] = useState<boolean>(false);

  const toggleFriends = () => {
    setShowPop(!showPop);
    setIsFriends(true);
  };

  const toggleRecommendations = () => {
    setShowPop(!showPop);
    setIsFriends(false);
  };

  return (
    <div className="w-screen h-screen flex">
      <Sidebar /> {/* Use the Sidebar component */}
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
              <button onClick={toggleFriends} className="btn btn-success">
                Friends
              </button>
              <button onClick={toggleRecommendations} className="btn btn-success">
                Recommendations
              </button>
              <button className="btn btn-success" onClick={() => navigate("/" + username + "/settings")}>Edit Profile</button>
              <ListPopup
                show={showPop}
                handleClose={toggleFriends}
                isFriends={isFriends}
                activeUser={username ? username : profile.username}
              />
            </div>
          </div>
        </div>
        <div>
          <PostProfileHandler posts={posts} />
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
