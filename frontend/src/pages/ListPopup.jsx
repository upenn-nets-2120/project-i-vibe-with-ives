import React from "react";
import "./Popup.css";
import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";

const ListPopup = ({ handleClose, show, isFriends, username }) => {
  const [friends, setFriends] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/${username}/friends`
      );

      console.log(response.data.result);
      setFriends(response.data.result);

      const response2 = await axios.get(
        `http://localhost:8080/${username}/recommendations`
      );

      console.log(response2.data.result);
      setRecommendations(response2.data.result);
    } catch (error) {
      setFriends([{ friend_username: error.message }]);
      setRecommendations([
        {
          user_id: 0,
          username: error.message,
        },
      ]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showHideClassName = show ? "popup display-block" : "popup display-none";

  return (
    <div className={showHideClassName}>
      <section className="popup-main">
        {isFriends &&
          friends.map((friend) => (
            <h3 key={friend.friend_username}>{friend.friend_username}</h3>
          ))}
        {!isFriends &&
          recommendations.map((rec) => (
            <h3 key={rec.user_id}>{rec.username}</h3>
          ))}

        <button className="btn btn-success" onClick={handleClose}>
          Close
        </button>
      </section>
    </div>
  );
};

export default ListPopup;
