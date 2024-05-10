import React, { useEffect } from "react";
// import "./App.css";
import "./Profile.css";
import ListPopup from "./ListPopup";
import PostProfileHandler from "./PostProfileHandler";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { Post } from "./MyProfile";
import { Profile } from "./MyProfile";
import Sidebar from '../components/Sidebar';
import { useNavigate, useParams } from "react-router-dom";

// usestate import
import { useState } from "react";

const UserProfile = () => {
  // const { username, name, actor, posts } = props;
  const navigate = useNavigate();
  const { username, activeUser } = useParams();
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

  const [showPop, setShowPop] = useState<boolean>(false);

  // 1 for Request, 2 for Requested, 3 for Following
  const [buttonState, setButtonState] = useState<number>(1);
  const [buttonText, setButtonText] = useState<string>("Request");
  const [actor, setActor] = useState<string>("");

  const fetchData = async () => {
    // const username = activeUser;
    let response = await axios.get(
      `http://localhost:8080/${activeUser}/getProfile`
    );
    setProfile(response.data.result);

    response = await axios.get(`http://localhost:8080/${activeUser}/getPosts`);
    setPosts(response.data.result);

    response = await axios.get(
      `http://localhost:8080/${username}/isFriendsWith/${activeUser}`
    );
    if (response.data.result) {
      setButtonState(3);
    } else {
      response = await axios.get(
        `http://localhost:8080/${username}/hasRequested/${activeUser}`
      );

      if (response.data.result) {
        setButtonState(2);
      }
    }

    const response3 = await axios.post(
      `http://localhost:8080/getLinkedActor`, { linked_nconst: profile.linked_nconst }
    )

    setActor(response3.data.actor);
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
          `http://localhost:8080/${username}/requestFriend`,
          { friend: profile.username }
        );

      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="w-screen h-screen flex">
      <Sidebar />
      <div className="profile-container">
        <div className="content">
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
              {profile.first_name} {profile.last_name} is now linked to {actor}!
            </p>
            <div className="profile-buttons">
              <button onClick={toggleFriends} className="btn btn-success">
                Friends
              </button>
              <button onClick={friendRequest} className="btn btn-success">
                {buttonText}
              </button>
              <ListPopup
                show={showPop}
                handleClose={toggleFriends}
                isFriends={true}
                activeUser={activeUser ? activeUser : profile.username}
              />
            </div>
          </div>
        </div>
        <div>
          <PostProfileHandler posts={posts} />
        </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
