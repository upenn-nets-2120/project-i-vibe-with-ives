import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.min.css';
import axios from "axios";

axios.defaults.withCredentials = true;

export default function Sidebar() {
    const navigate = useNavigate();
    const { username } = useParams();

    const buttonStyle = {
        width: "100%",
        marginBottom: "10px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "50px",
        color: "white"
    };

    const handleLogout = async () => {
        try {
            await axios.get("/logout");
            navigate("/");
        } catch (error) {
            console.error('Logout failed:', error);
            alert('Failed to log out');
        }
    };

    return (
        <div style={sidebarStyle}>
            <button style={buttonStyle} onClick={() => navigate("/" + username + "/home")}><i className="fas fa-home"></i></button>
            <button style={buttonStyle} onClick={() => navigate("/" + username + "/chats")}><i className="fas fa-comments"></i></button>
            <button style={buttonStyle} onClick={() => navigate("/" + username + "/search")}><i className="fas fa-question-circle"></i></button>
            <button style={buttonStyle} onClick={() => navigate("/" + username + "/notifications")}><i className="fas fa-bell"></i></button>
            <button style={buttonStyle} onClick={() => navigate("/" + username + "/friends")}><i className="fas fa-user-friends"></i></button>
            <button style={buttonStyle} onClick={() => navigate("/" + username + "/profile")}><i className="fas fa-user-circle"></i></button>
            <button style={buttonStyle} onClick={() => navigate("/" + username + "/settings")}><i className="fas fa-cog"></i></button>
            <button style={buttonStyle} onClick={handleLogout}><i className="fas fa-sign-out-alt"></i></button>
        </div>
    );
}

const sidebarStyle = {
    width: "50px",
    backgroundColor: "#000",
    height: "100%",
    padding: "10px 0",
    boxShadow: "2px 0 5px rgba(0,0,0,0.1)"
};