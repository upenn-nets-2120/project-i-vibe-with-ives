import React from "react";
import "./Popup.css";
import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

interface Friend {
  friend_username: string;
}

interface Recommendation {
  user_id: number;
  username: string;
}

const ListPopup = ({
  handleClose,
  show,
  isFriends,
  activeUser,
}: {
  handleClose: () => void;
  show: boolean;
  isFriends: boolean;
  activeUser: string;
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const fetchData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/${activeUser}/friends`
      );

      console.log(response.data.result);
      setFriends(response.data.result);

      const response2 = await axios.get(
        `http://localhost:8080/${activeUser}/recommendations`
      );

      console.log(response2.data.result);
      setRecommendations(response2.data.result);
    } catch (error) {
      setFriends([{ friend_username: "Error fetching friends" }]);
      setRecommendations([
        {
          user_id: 0,
          username: "Error fetching recommendations",
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
