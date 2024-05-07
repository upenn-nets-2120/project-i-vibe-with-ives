import React, { useState } from 'react';
import { useParams } from "react-router-dom";
import axios from 'axios';
import config from '../../config.json';
import Sidebar from '../components/Sidebar'; // Ensure Sidebar is correctly imported

export default function Settings() {
    const { username } = useParams();
    const rootURL = config.serverRootURL;

    const [hashtag, setHashtag] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userPassword, setUserPassword] = useState('');

    const handleAddHashtag = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        try {
            await axios.post(`${rootURL}/${username}/addHashtag`, { username, hashtag });
            alert('Hashtag added successfully!');
            setHashtag('');
        } catch (error) {
            alert('Failed to add hashtag.');
        }
    };

    const handleRemoveHashtag = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        try {
            await axios.post(`${rootURL}/${username}/removeHashtag`, { username, hashtag });
            alert('Hashtag removed successfully!');
            setHashtag('');
        } catch (error) {
            alert('Failed to remove hashtag.');
        }
    };

    const handleSetEmail = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        try {
            await axios.post(`${rootURL}/${username}/setEmail`, { username: username, email: userEmail });
            alert('Email updated successfully!');
            setUserEmail('');
        } catch (error) {
            alert('Failed to update email.');
        }
    };

    const handleSetPassword = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        try {
            await axios.post(`${rootURL}/${username}/setPassword`, { username: username, password: userPassword });
            alert('Password changed successfully!');
            setUserPassword('');
        } catch (error) {
            alert('Failed to change password.');
        }
    };

    return (
        <div className="flex w-screen h-screen">
            <Sidebar />
            <div className="flex-1 p-10 overflow-y-auto bg-gray-100">
                <h2 className="text-2xl font-bold mb-6">Settings</h2>
                <div className="mb-6">
                    <h3 className="mb-4 text-xl font-semibold">Manage Hashtag</h3>
                    <form onSubmit={handleAddHashtag} className="mb-4 flex gap-4 items-end">
                        <input type="text" value={hashtag} onChange={(e) => setHashtag(e.target.value)} placeholder="Enter hashtag" className="flex-1 border border-gray-300 p-2 rounded" />
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Add Hashtag</button>
                    </form>
                    <button onClick={handleRemoveHashtag} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Remove Hashtag</button>
                </div>
                <div className="mb-6">
                    <h3 className="mb-4 text-xl font-semibold">Update Email</h3>
                    <form onSubmit={handleSetEmail} className="flex gap-4 items-end">
                        <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Enter new email" className="flex-1 border border-gray-300 p-2 rounded" />
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Update Email</button>
                    </form>
                </div>
                <div className="mb-6">
                    <h3 className="mb-4 text-xl font-semibold">Change Password</h3>
                    <form onSubmit={handleSetPassword} className="flex gap-4 items-end">
                        <input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder="Enter new password" className="flex-1 border border-gray-300 p-2 rounded" />
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Change Password</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
