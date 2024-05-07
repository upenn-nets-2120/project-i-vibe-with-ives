import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useNavigate, useParams } from "react-router-dom";

export default function PostComponent({
  id,  // Ensure that id is passed to each PostComponent
  user,
  caption,
  imageUrl
}) {
  const { username } = useParams();
  const navigate = useNavigate();
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);  // State to track if the current user has liked the post
  const [comments, setComments] = useState([]);  // State to store comments
  const [commentText, setCommentText] = useState(''); // State to track the comment input text


  const rootURL = config.serverRootURL;

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const likesResponse = await axios.get(`${rootURL}/${id}/getLikes`);
        setLikes(likesResponse.data);

        const likedResponse = await axios.get(`${rootURL}/${id}/${username}/getLikedByUser`);
        setLiked(likedResponse.data);

        const commentsResponse = await axios.get(`${rootURL}/${id}/getComments`);
        setComments(commentsResponse.data || []);  // Assuming `comments` is the field where comments are stored
        console.log("comments response", commentsResponse.data);
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

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      try {
        const postResponse = await axios.post(`${rootURL}/${username}/createComment`, {
          caption: commentText,
          post_id: id
        });
        if (postResponse.status === 201) {
          setCommentText('');  // Clear the input after submission

          // Fetch the latest set of comments after adding the new comment
          const commentsResponse = await axios.get(`${rootURL}/${id}/getComments`);
          setComments(commentsResponse.data || []);  // Adjust according to actual data structure
        }
      } catch (error) {
        console.error('Failed to post comment:', error);
      }
    }
  };


  return (
    <div className='rounded-md bg-slate-50 w-full max-w-[500px] space-y-2 p-3'>
      <div className='text-slate-800'>
        <span className='font-semibold' onClick={() => navigate("/" + username + "/" + user + "/userProfile")}>@{user}</span> posted
      </div>
      {imageUrl && <img src={imageUrl} alt="Post image" className="w-full max-w-md h-auto rounded-md" />}
      <div>
        {caption}
      </div>
      <button
        className={`mt-2 py-1 px-4 rounded ${liked ? 'bg-gray-400' : 'bg-blue-500 text-white'} hover:bg-blue-700`}
        onClick={handleLike}>
        {liked ? 'Unlike' : 'Like'}
      </button>
      <span>{likes} Likes</span>
      <div style={{ width: '100%', padding: '10px' }}>
        <form onSubmit={handleCommentSubmit}>
          <input
            type="text"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            style={{ width: '100%', padding: '8px', margin: '10px 0', boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ width: '100%', padding: '8px', backgroundColor: 'blue', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Post Comment
          </button>
        </form>
      </div>
      <div>
        <h3>Comments:</h3>
        {comments.map(comment => (
          <div key={comment.comment_id} className="bg-gray-100 rounded p-2 my-1">
            <strong>{comment.username}:</strong> {comment.caption}
          </div>
        ))}
      </div>
    </div>
  );
}

