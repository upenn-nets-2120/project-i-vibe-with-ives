import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../../config.json";

axios.defaults.withCredentials = true;

export default function Signup() {
  const navigate = useNavigate();

  // TODO: set appropriate state variables
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [birthday, setBirthday] = useState("");
  const [email, setEmail] = useState("");
  const [linked_nconst, setLinkedNconst] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);

  const rootURL = config.serverRootURL;

  const handleImageUpload = async (e: { target: { files: any[]; }; }) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${rootURL}/actors`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  const handleSubmit = async () => {
    // TODO: make sure passwords match
    // TODO: send registration request to backend
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (username === "" || password === "" || email === "") {
      alert("username, password, and email are required!");
      return;
    }
    // Validate birthday
    const birthdayDate = new Date(birthday);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Remove time part

    // Check if the birthday is in the future
    if (birthdayDate > currentDate) {
      alert("Birthday cannot be in the future.");
      return;
    }

    // Calculate age to check minimum age requirement
    const ageDiffMs = currentDate.getTime() - birthdayDate.getTime();
    const ageDate = new Date(ageDiffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);

    // Check if age meets the minimum requirement
    if (age < 13) {
      alert("You must be at least 13 years old to register.");
      return;
    }
    try {
      // console.log(JSON.stringify({  username,password, linked_nconst}))

      //axios post with body parameters
      const response = await axios.post(`${rootURL}/register`, {
        username, password, linked_nconst, firstName, lastName, affiliation, birthday, email
      });

    } catch (error) {
      console.log(error)
      alert(error);
    }

    alert("Successfully registered!");
    navigate("/" + username + "/home");

  };



  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit}>
        <div className="rounded-md bg-slate-50 p-6 space-y-2 w-full">
          <div className="font-bold flex w-full justify-center text-2xl mb-4">
            Sign Up to Pennstagram
          </div>
          {/* <div className="flex space-x-4 items-center justify-between">
            <label htmlFor="uploadedImage" className="font-semibold">
              Upload Selfie
            </label>
            <input
              id="uploadedImage"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files[0])} // Call handleImageChange on file selection
            />
          </div> */}
          <div className="flex space-x-4 items-center justify-between">
            <label htmlFor="username" className="font-semibold">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="outline-none bg-white rounded-md border border-slate-100 p-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="flex space-x-4 items-center justify-between">
            <label htmlFor="linked_nconst" className="font-semibold">
              Linked nconst
            </label>
            <input
              id="linked_nconst"
              type="text"
              className="outline-none bg-white rounded-md border border-slate-100 p-2"
              value={linked_nconst}
              onChange={(e) => setLinkedNconst(e.target.value)}
            />
          </div>
          <div className="flex space-x-4 items-center justify-between">
            <label htmlFor="firstName" className="font-semibold">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              className="outline-none bg-white rounded-md border border-slate-100 p-2"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="flex space-x-4 items-center justify-between">
            <label htmlFor="lastName" className="font-semibold">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              className="outline-none bg-white rounded-md border border-slate-100 p-2"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="flex space-x-4 items-center justify-between">
            <label htmlFor="affiliation" className="font-semibold">
              Affiliation
            </label>
            <input
              id="affiliation"
              type="text"
              className="outline-none bg-white rounded-md border border-slate-100 p-2"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
            />
          </div>
          <div className="flex space-x-4 items-center justify-between">
            <label htmlFor="birthday" className="font-semibold">
              Birthday
            </label>
            <input
              id="birthday"
              type="date"
              className="outline-none bg-white rounded-md border border-slate-100 p-2"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>
          <div className="flex space-x-4 items-center justify-between">
            <label htmlFor="email" className="font-semibold">
              Email
            </label>
            <input
              id="email"
              type="text"
              className="outline-none bg-white rounded-md border border-slate-100 p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex space-x-4 items-center justify-between">
            <label htmlFor="password" className="font-semibold">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="outline-none bg-white rounded-md border border-slate-100 p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex space-x-4 items-center justify-between">
            <label htmlFor="confirmPassword" className="font-semibold">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="outline-none bg-white rounded-md border border-slate-100 p-2"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="w-full flex justify-center">
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white"
            >
              Sign up
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
