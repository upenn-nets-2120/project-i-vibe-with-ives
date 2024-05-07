import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import axios from 'axios';
import config from '../../config.json';
import Sidebar from '../components/Sidebar';

axios.defaults.withCredentials = true;

export default function Notifications() {
    const { username } = useParams();
    const rootURL = config.serverRootURL;
    const [requests, setRequests] = useState([]);

    const fetchRequests = async () => {
        const response = await axios.get(`${rootURL}/${username}/getFriendRequests`);
        setRequests(response.data || []);
    };

    useEffect(() => {
        fetchRequests();
    }, [username]);

    const handleAccept = async (requester) => {
        await axios.post(`${rootURL}/${username}/acceptFriend`, { username: username, friend: requester });
        fetchRequests(); // Refresh the list after action
    };

    const handleRemove = async (requester) => {
        await axios.post(`${rootURL}/${username}/removeFriend`, { username: username, friend: requester });
        fetchRequests(); // Refresh the list after action
    };

    return (
        <div className="w-screen h-screen flex">
            <Sidebar />
            <div className="flex-1 overflow-y-auto p-10">
                <h2 className="text-2xl font-bold text-center mb-6">Friend Requests</h2>
                <ul className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 shadow-md">
                    {requests.map((request, index) => (
                        <li key={index} className="flex justify-between items-center p-4 border-b border-gray-200 last:border-b-0">
                            <span className="text-gray-900 font-medium">{request.requester_username} wants to be friends.</span>
                            <div>
                                <button className="text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2" onClick={() => handleAccept(request.requester_username)}>Accept</button>
                                <button className="text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2" onClick={() => handleRemove(request.requester_username)}>Remove</button>
                            </div>
                        </li>
                    ))}
                </ul>
                {requests.length === 0 && <p className="text-center text-gray-500">No friend requests.</p>}
            </div>
        </div>
    );
}
