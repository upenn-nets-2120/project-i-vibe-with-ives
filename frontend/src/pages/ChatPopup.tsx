import React from "react";
import "./ChatPopup.css";
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

const ChatPopup = ({
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

            // console.log(response.data.results);
            setFriends(response.data.results);

            const response2 = await axios.get(
                `http://localhost:8080/${activeUser}/recommendations`
            );

            // console.log(response2.data.results);
            setRecommendations(response2.data.results);
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

    const startChat = (username: string) => {
        console.log("Starting chat with:", username);
        // Implement functionality to navigate to the chat or open chat window here
    };

    const showHideClassName = show ? "popup display-block" : "popup display-none";

    return (
        <div className={showHideClassName}>
            <section className="popup-main">
                {isFriends ? (
                    friends.length > 0 ? (
                        friends.map((friend) => (
                            <div key={friend.friend_username} className="friend-entry">
                                <h3>{friend.friend_username}</h3>
                                <button className="chat-button" onClick={() => startChat(friend.friend_username)}>
                                    <i className="fas fa-comments"></i>
                                </button>
                            </div>))
                    ) : (
                        <p>No friends to display.</p>
                    )
                ) : (
                    recommendations.length > 0 ? (
                        recommendations.map((rec) => <h3 key={rec.user_id}>{rec.username}</h3>)
                    ) : (
                        <p>No recommendations to display.</p>
                    )
                )}

                <button className="btn btn-success" onClick={handleClose}>
                    Close
                </button>
            </section>
        </div>
    );
};

export default ChatPopup;