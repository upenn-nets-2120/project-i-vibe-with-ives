// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import config from '../../config.json';
// import { useParams, useNavigate } from "react-router-dom";


// export default function PostComponent({
//   id,  // Ensure that id is passed to each PostComponent
//   title,
//   user,
//   description,
//   imageUrl
// }) {
//   const { username } = useParams();
//   const [likes, setLikes] = useState(0);
//   const [liked, setLiked] = useState(false);  // State to track if the current user has liked the post
//   const rootURL = config.serverRootURL;

//   useEffect(() => {
//     const fetchLikes = async () => {
//       try {
//         // Fetching the total number of likes
//         const likesResponse = await axios.get(`${rootURL}/${id}/getLikes`);
//         setLikes(likesResponse.data);

//         // Checking if the current user has liked the post
//         const likedResponse = await axios.get(`${rootURL}/${id}/${username}/getLikedByUser`);
//         setLiked(likedResponse.data);  // assuming the API returns a boolean in `liked` field
//       } catch (error) {
//         console.error('Failed to fetch likes or liked status:', error);
//       }
//     };

//     fetchLikes();
//   }, [id]);

//   const handleLike = async () => {
//     if (!liked) {
//       try {
//         const response = await axios.post(`${rootURL}/${user}/likePost`, { post_id: id });
//         if (response.status === 201) {
//           setLikes(likes + 1);
//           setLiked(true);
//         }
//       } catch (error) {
//         console.error('Failed to like the post:', error);
//       }
//     }
//   };

//   return (
//     <div className='rounded-md bg-slate-50 w-full max-w-[500px] space-y-2 p-3'>
//       <div className='text-slate-800'>
//         <span className='font-semibold'>@{user}</span> posted
//       </div>
//       <div className='text-2xl font-bold'>
//         {title}
//       </div>
//       {imageUrl && <img src={imageUrl} alt="Post image" className="w-full max-w-md h-auto rounded-md" />}
//       <div>
//         {description}
//       </div>
//       <button 
//         className={`mt-2 py-1 px-4 rounded ${liked ? 'bg-gray-400' : 'bg-blue-500 text-white'} hover:bg-blue-700`}
//         onClick={handleLike}
//         disabled={liked}>
//         {liked ? 'Liked' : 'Like'}
//       </button>
//       <span>{likes} Likes</span>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useParams } from "react-router-dom";

export default function PostComponent({
  id,  // Ensure that id is passed to each PostComponent
  title,
  user,
  description,
  imageUrl
}) {
  const { username } = useParams();
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);  // State to track if the current user has liked the post
  const rootURL = config.serverRootURL;

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const likesResponse = await axios.get(`${rootURL}/${id}/getLikes`);
        setLikes(likesResponse.data);  // assuming likes count returned in `likes` field

        const likedResponse = await axios.get(`${rootURL}/${id}/${username}/getLikedByUser`);
        setLiked(likedResponse.data);  // assuming the API returns a boolean in `liked` field
      } catch (error) {
        console.error('Failed to fetch likes or liked status:', error);
      }
    };

    fetchLikes();
  }, [id]);

  const handleLike = async () => {
    try {
      let response;
      if (!liked) {
        response = await axios.post(`${rootURL}/${username}/likePost`, { post_id: id });
        if (response.status === 201) {
          setLikes(likes + 1);
          setLiked(true);
        }
      } else {
        response = await axios.post(`${rootURL}/${username}/unlikePost`, { post_id: id });
        if (response.status === 200) {
          setLikes(likes - 1);
          setLiked(false);
        }
      }
    } catch (error) {
      console.error('Failed to toggle like on the post:', error);
    }
  };

  return (
    <div className='rounded-md bg-slate-50 w-full max-w-[500px] space-y-2 p-3'>
      <div className='text-slate-800'>
        <span className='font-semibold'>@{user}</span> posted
      </div>
      <div className='text-2xl font-bold'>
        {title}
      </div>
      {imageUrl && <img src={imageUrl} alt="Post image" className="w-full max-w-md h-auto rounded-md" />}
      <div>
        {description}
      </div>
      <button 
        className={`mt-2 py-1 px-4 rounded ${liked ? 'bg-gray-400' : 'bg-blue-500 text-white'} hover:bg-blue-700`}
        onClick={handleLike}>
        {liked ? 'Unlike' : 'Like'}
      </button>
      <span>{likes} Likes</span>
    </div>
  );
}

