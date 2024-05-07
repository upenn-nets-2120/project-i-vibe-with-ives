import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../../config.json";

axios.defaults.withCredentials = true;


interface Actor {
    id: string;
    name: string;
}

interface ActorPopupProps {
    options: Actor[];
    onSelect: (actor: Actor) => void;
    onClose: () => void;
}

export default function Actor() {
    const [uploadedImage, setUploadedImage] = useState(null);
    const [showActorPopup, setShowActorPopup] = useState(false);
    const [actorOptions, setActorOptions] = useState([]);
    const rootURL = config.serverRootURL;


    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append("file", file);

            try {
                const response = await axios.post(`${rootURL}/actors`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
                // Assuming the response data contains actors, update the state appropriately
                setActorOptions(response.data);
                setShowActorPopup(true);
            } catch (error) {
                console.error(error);
            }
        }
    };
    return (
        <div className="flex space-x-4 items-center justify-between">
            <label htmlFor="uploadedImage" className="font-semibold">
                Upload Profile Picture (required)
            </label>
            <input
                id="uploadedImage"
                type="file"
                accept="image/*"
                onChange={handleImageUpload} // Adjust this to handle file selection properly
            />
        </div>
    );
}


const ActorPopup: React.FC<ActorPopupProps> = ({ options, onSelect, onClose }) => {
    return (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg">
                <h3 className="text-lg font-bold">Select an Actor</h3>
                <ul>
                    {options.map((actor) => (
                        <li key={actor.id} className="p-2 cursor-pointer hover:bg-gray-100" onClick={() => onSelect(actor)}>
                            {actor.name}
                        </li>
                    ))}
                </ul>
                <button className="mt-4 px-4 py-2 bg-red-500 text-white rounded" onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

