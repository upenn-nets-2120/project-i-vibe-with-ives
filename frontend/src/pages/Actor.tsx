import React, { useState } from "react";
import axios from "axios";
import config from "../../config.json";
import { useParams, useNavigate } from "react-router-dom";

axios.defaults.withCredentials = true;

interface Actor {
    linked_nconst: string;
    img: string;
}

interface ActorPopupProps {
    options: Actor[];
    onSelect: (actor: Actor) => void;
    onClose: () => void;
}

const Actor: React.FC = () => {
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [showActorPopup, setShowActorPopup] = useState(false);
    const [actorOptions, setActorOptions] = useState<Actor[]>([]);
    const rootURL = config.serverRootURL;
    const { username } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (uploadedImage) {
            const formData = new FormData();
            formData.append("file", uploadedImage);

            try {
                await axios.post(`${rootURL}/${username}/uploadProfilePhoto`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    withCredentials: true,
                });
                const response = await axios.post(`${rootURL}/${username}/actors`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
                // Assuming the response data contains a list of actors
                setActorOptions(response.data.actors);
                setShowActorPopup(true);
            } catch (error) {
                console.error("Error uploading image and fetching actors:", error);
            }
        }
    };

    const handleSelectActor = async (actor: Actor) => {
        try {
            await axios.post(`${rootURL}/` + username + `/setActor`, { actor: actor.linked_nconst });
            console.log(`Actor ${actor.linked_nconst} set successfully.`);
            setShowActorPopup(false);
            navigate("/" + username + "/home");
        } catch (error) {
            console.error("Error setting actor:", error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center">
            <form onSubmit={handleSubmit} className="w-full max-w-md">
                <label htmlFor="uploadedImage" className="font-semibold mb-2">
                    Upload Profile Picture (required)
                </label>
                <input
                    id="uploadedImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && setUploadedImage(e.target.files[0])}
                    className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <button type="submit" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded shadow-lg hover:bg-blue-600">Upload</button>
            </form>
            {showActorPopup && (
                <ActorPopup options={actorOptions} onSelect={handleSelectActor} onClose={() => setShowActorPopup(false)} />
            )}
        </div>
    );
};

const ActorPopup: React.FC<ActorPopupProps> = ({ options, onSelect, onClose }) => {
    return (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg">
                <h3 className="text-lg font-bold">Select an Actor</h3>
                <ul style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {options.map((actor) => (
                        <li key={actor.linked_nconst} className="p-2 cursor-pointer hover:bg-gray-100" onClick={() => onSelect(actor)}>
                            <img src={`http://localhost:8080/images/${actor.img}`} alt={`Actor ${actor.linked_nconst}`} style={{ width: '100px', height: '150px', objectFit: 'cover' }} />
                        </li>
                    ))}
                </ul>
                <button className="mt-4 px-4 py-2 bg-red-500 text-white rounded" onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default Actor;
