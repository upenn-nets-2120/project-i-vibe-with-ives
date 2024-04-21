import { useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import config from "../../config.json";


const MessageComponent = ({
  sender,
  message,
}: {
  sender: string;
  message: string;
}) => {
  return (
    <div className={`w-full flex ${sender === "user" && "justify-end"}`}>
      <div
        className={`text-left max-w-[70%] p-3 rounded-md break-words ${
          sender === "user" ? "bg-blue-100" : "bg-slate-200"
        }`}
      >
        {message}
      </div>
    </div>
  );
};

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      sender: "chatbot",
      message: "Hi there! What movie review questions do you have?",
    },
  ]);
  const [input, setInput] = useState('');
  const { username } = useParams();
  const navigate = useNavigate();
  const rootURL = config.serverRootURL;


  const feed = () => {
    navigate("/" + username + "/home");
  };
  const friends = () => {
    navigate("/" + username + "/friends");
  };

  const sendMessage = async () => {

    // TODO: make a call to the getMovies route
    const response = await axios.post(`${rootURL}/${username}/movies`, {
      question: input,
    });

    console.log(response)

    // TODO: add the chatbot's response to the messages state
    setMessages([...messages, { sender: "user", message: input }, { sender: "chatbot", message: response.data.message }]);
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center">
      <div className="w-full h-16 bg-slate-50 flex justify-center mb-2">
        <div className="text-2xl max-w-[1800px] w-full flex items-center">
          Pennstagram - {username} &nbsp;
          <button
            type="button"
            className="px-2 py-2 rounded-md bg-gray-500 outline-none text-white"
            onClick={feed}
          >
            Feed
          </button>
          &nbsp;
          <button
            type="button"
            className="px-2 py-2 rounded-md bg-gray-500 outline-none text-white"
            onClick={friends}
          >
            Friends
          </button>
        </div>
      </div>
      <div className="font-bold text-3xl">Internet Movie DB Chat</div>
      <div className="h-[40rem] w-[30rem] bg-slate-100 p-3">
        <div className="h-[90%] overflow-scroll">
          <div className="space-y-2">
            {messages.map((msg) => {
              return (
                <MessageComponent sender={msg.sender} message={msg.message} />
              );
            })}
          </div>
        </div>
        <div className="w-full flex space-x-2">
          <input
            className="w-full outline-none border-none px-3 py-1 rounded-md"
            placeholder="Ask something!"
            onChange={(e) => setInput(e.target.value)}
            value={input}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
                setInput("");
              }
            }}
          />
          <button
            className="outline-none px-3 py-1 rounded-md text-bold bg-indigo-600 text-white"
            onClick={() => {
              sendMessage();
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
