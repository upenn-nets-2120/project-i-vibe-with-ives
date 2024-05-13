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
    currentChat,
}: {
    handleClose: () => void;
    show: boolean;
    isFriends: boolean;
    activeUser: string;
    currentChat: string;
}) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const { username } = useParams();
    const fetchData = async () => {
        try {
            const response = await axios.get(
                `http://localhost:8080/${activeUser}/friends`
            );

            // console.log(response.data.results);
            setFriends(response.data.results);

        } catch (error) {
            setFriends([{ friend_username: "Error fetching friends" }]);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInvite = async (friend: string) => {
        console.log(currentChat, friend, username);
        try {
            await axios.post(`http://localhost:8080/${username}/inviteMember`, {
                chat_name: currentChat,
                username: username,
                invitee: friend,
            });
            alert('Invite sent to' + friend + '!');
        } catch (error) {
            console.error("Error Inviting Friend:", error);
        }
    };

    const showHideClassName = show ? "popup display-block" : "popup display-none";

    return (
        <div className={showHideClassName}>
            <section className="popup-main">
                <h1>Invite Friends to: {currentChat}</h1>
                {isFriends ? (
                    friends.length > 0 ? (
                        friends.map((friend) => (
                            <div key={friend.friend_username} className="friend-entry">
                                <h3>{friend.friend_username}</h3>
                                <button className="chat-button" onClick={() => handleInvite(friend.friend_username)}>
                                    <i className="fas fa-comments"></i>
                                </button>
                            </div>))
                    ) : (
                        <p>Add some friends to chat with them!.</p>
                    )
                ) : (
                    <p>Add some friends to chat with them!.</p>
                )}

                <button className="btn btn-success" onClick={handleClose}>
                    Close
                </button>
            </section>
        </div>
    );
};

export default ChatPopup;