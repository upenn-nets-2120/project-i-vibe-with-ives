import React, { useEffect } from "react";
import "./App.css";
import "./Profile.css";
import ListPopup from "./ListPopup";
import PostProfileHandler from "./PostProfileHandler";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

// usestate import
import { useState } from "react";

const UserProfile = ({ loggedIn, activeUser }) => {
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

  const [showPop, setShowPop] = useState(false);

  // 1 for Request, 2 for Requested, 3 for Following
  const [buttonState, setButtonState] = useState(1);
  const [buttonText, setButtonText] = useState("Request");

  const fetchData = async () => {
    const username = activeUser;
    let response = await axios.get(
      `http://localhost:8080/${username}/getProfile`
    );
    setProfile(response.data.result);

    response = await axios.get(`http://localhost:8080/${username}/getPosts`);
    setPosts(response.data.result);

    response = await axios.get(
      `http://localhost:8080/${loggedIn}/isFriendsWith/${username}`
    );
    if (response.data.result) {
      setButtonState(3);
    } else {
      response = await axios.get(
        `http://localhost:8080/${loggedIn}/hasRequested/${username}`
      );

      if (response.data.result) {
        setButtonState(2);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (buttonState === 1) {
      setButtonText("Request");
    } else if (buttonState === 2) {
      setButtonText("Requested");
    } else {
      setButtonText("Following");
    }
  }, [buttonState]);

  const toggleFriends = () => {
    setShowPop(!showPop);
  };

  const friendRequest = async () => {
    // if NOT requested, then send request
    if (buttonState === 1) {
      setButtonState(2);

      try {
        const response = await axios.post(
          `http://localhost:8080/${loggedIn}/requestFriend`,
          { friend: profile.username }
        );
      } catch (error) {
        console.error(error);
      }
    }
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
            <button onClick={toggleFriends} className="btn btn-success">
              Friends
            </button>
            <button onClick={friendRequest} className="btn btn-success">
              {buttonText}
            </button>
            <button className="btn btn-success">Edit Profile</button>
            <ListPopup
              show={showPop}
              handleClose={toggleFriends}
              isFriends={true}
              username={profile.username}
            />
          </div>
        </div>
      </div>
      <div>
        <PostProfileHandler
          posts={posts}
          username={profile.username}
          loggedIn={loggedIn}
        />
      </div>
    </div>
  );
};

export default UserProfile;
