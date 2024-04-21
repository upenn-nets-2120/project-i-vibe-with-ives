import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import config from "../../config.json";
import PostComponent from "../components/PostComponent";
import CreatePostComponent from "../components/CreatePostComponent";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { username } = useParams();
  const rootURL = config.serverRootURL;

  const navigate = useNavigate();

  const friends = () => {
    navigate("/" + username + "/friends");
  };

  const chat = () => {
    navigate("/" + username + "/chat");
  };

  // TODO: add state variable for posts
  const [posts, setPosts] = useState([]);

  const fetchData = async () => {
    // TODO: fetch posts data and set appropriate state variables
    const response = await axios.get(`${rootURL}/${username}/feed`);
    setPosts(response.data.results);
  };

  useEffect(() => {

    fetchData();
  }, []);

  console.log(posts)

  return (
    <div className="w-screen h-screen">
      <div className="w-full h-16 bg-slate-50 flex justify-center mb-2">
        <div className="text-2xl max-w-[1800px] w-full flex items-center">
          Pennstagram - {username} &nbsp;
          <button
            type="button"
            className="px-2 py-2 rounded-md bg-gray-500 outline-none text-white"
            onClick={friends}
          >
            Friends
          </button>
          &nbsp;
          <button
            type="button"
            className="px-2 py-2 rounded-md bg-gray-500 outline-none text-white"
            onClick={chat}
          >
            Chat
          </button>
        </div>
      </div>

      <div className="h-full w-full mx-auto max-w-[1800px] flex flex-col items-center space-y-4">
        <CreatePostComponent updatePosts={fetchData} />
        {
          // TODO: map each post to a PostComponent
          posts.map((post) => {
             return <PostComponent title={post.title} user={post.username} description={post.content} key={post.title}/>;
          })
        }
      </div>
    </div>
  );
}
