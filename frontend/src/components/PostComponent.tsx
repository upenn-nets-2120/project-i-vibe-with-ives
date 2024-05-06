// export default function PostComponent({
//   title = 'Post title',
//   user = 'arnavchopra',
//   description = 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Rem porro consequatur impedit dolor, soluta rerum mollitia ut eos fugiat! Amet nam voluptate quos delectus rem enim veritatis eius iste! Et.',
//   imageUrl = ''
// }: {
//   title: string,
//   user: string,
//   description: string,
//   imageUrl: string
// }) {
//   return (
//     <div className='rounded-md bg-slate-50 w-full max-w-[500px] space-y-2 p-3'>
//       <div className=' text-slate-800'>
//         <span className='font-semibold'> @{user} </span>
//         posted
//       </div>
//       <div className='text-2xl font-bold'>
//         {title}
//       </div>
//       {imageUrl && <img src={imageUrl} alt="Post image" className="w-full max-w-md h-auto rounded-md" />}
//       <div className=''>
//         {description}
//       </div>
//     </div>
//   )
// }

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config.json';

export default function PostComponent({
  id,  // Ensure that id is passed to each PostComponent
  title,
  user,
  description,
  imageUrl
}) {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);  // State to track if the current user has liked the post
  const rootURL = config.serverRootURL;

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const response = await axios.get(`${rootURL}/${id}/getLikes`);
        setLikes(response.data.likes);
        setLiked(response.data.likedByUser);  // This assumes the API returns if the current user liked the post
      } catch (error) {
        console.error('Failed to fetch likes:', error);
      }
    };

    fetchLikes();
  }, [id]);

  const handleLike = async () => {
    if (!liked) {
      try {
        const response = await axios.post(`${rootURL}/${user}/likePost`, { post_id: id });
        if (response.status === 201) {
          setLikes(likes + 1);
          setLiked(true);
        }
      } catch (error) {
        console.error('Failed to like the post:', error);
      }
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
      <button className={`mt-2 py-1 px-4 rounded ${liked ? 'bg-gray-400' : 'bg-blue-500 text-white'} hover:bg-blue-700`} onClick={handleLike} disabled={liked}>
        {liked ? 'Liked' : 'Like'}
      </button>
      <span>{likes} Likes</span>
    </div>
  );
}


