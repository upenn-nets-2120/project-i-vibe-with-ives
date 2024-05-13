import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useNavigate, useParams } from "react-router-dom";
import "./PostComponent.css";
import { Post } from "../pages/MyProfile"
import PostPopup from "../pages/PostPopup";

export default function PostComponent({
  id,  // Ensure that id is passed to each PostComponent
  user,
  caption,
  imageUrl,
  isSearch = false
}) {
  const { username } = useParams();
  const navigate = useNavigate();
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);  // State to track if the current user has liked the post
  const [comments, setComments] = useState([]);  // State to store comments
  const [commentText, setCommentText] = useState(''); // State to track the comment input text
  const [post, setPost] = useState<Post | null>(null);
  const [selected, setSelected] = useState<boolean>(false);
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const tweet = user === "twitteruser";


  const rootURL = config.serverRootURL;

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        try {

          const likesResponse = await axios.get(`${rootURL}/${id}/getLikes`);
          setLikes(likesResponse.data);

        } catch (error) {
          console.error('Failed to fetch likes:', error);
        }

        try {
          const likedResponse = await axios.get(`${rootURL}/${id}/${username}/getLikedByUser`);
          setLiked(likedResponse.data);

        } catch (error) {
          console.error('Failed to fetch liked status:', error);
        }

        try {
          const commentsResponse = await axios.get(`${rootURL}/${id}/getComments`);
          setComments(commentsResponse.data || []);  // Assuming `comments` is the field where comments are stored

        } catch (error) {
          console.error('Failed to fetch comments:', error);
        }

        let postResponse;

        try {
          if (tweet) {
            postResponse = await axios.get(
              `http://localhost:8080/${id}/getTweetById`
            );
            setPost(postResponse.data.result[0]);
          } else {
            const postResponse = await axios.get(
              `http://localhost:8080/${id}/getPostById`
            );
            setPost(postResponse.data.result[0]);
          }

        } catch (error) {
          console.error('Failed to fetch post:', error);
        }

        try {

          const photoResponse = await axios.get(`${rootURL}/${isSearch ? post.username : user}/profilePhoto`)
          setProfilePhoto(photoResponse.data.imageUrl)
          // console.log("setting profile pics")
          // console.log(profilePhoto)

        } catch (err) {
          console.error('Failed to fetch profile photo:', err);
        }

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
    <div className='post-container'>
      {selected && (
        <PostPopup onClick={() => setSelected(false)} sourcePost={post} />
      )}
      <div className='post-header'>
        <img src={(profilePhoto || profilePhoto == "undefined") ? profilePhoto : "https://t4.ftcdn.net/jpg/00/65/77/27/360_F_65772719_A1UV5kLi5nCEWI0BNLLiFaBPEkUbv5Fv.jpg"} alt={`${user}'s profile`} className="profile-pic-poster" />
        <span className='username' onClick={() => navigate(`/${username}/${isSearch ? post?.username : user}/userProfile`)}> <strong>@{isSearch ? post?.username : user}:</strong> posted </span>

      </div>
      {imageUrl && <img src={imageUrl} alt="Post image" className="post-image" />}
      <div className='caption'>{caption}</div>
      <div className='interactions'>
        {liked ?
          (
            <button className={`heart-icon`} onClick={() => handleLike()}>
              ❤️
            </button>
          ) : (
            <button className={`heart-icon`} onClick={() => handleLike()}>
              🤍
            </button>
          )}
        <span className='likes-count'> {likes} Likes</span>
      </div>
      <div className='comment-section'>
        <form onSubmit={handleCommentSubmit} className='comment-form'>
          <input
            type="text"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className='comment-input'
          />
          <button type="submit" className='submit-comment' style={{ backgroundColor: 'blue', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Post Comment</button>
        </form>
        <div className='comments-post'>
          <h3>Comments:</h3>
          {comments.slice(0, Math.min(comments.length, 2)).map(comment => (
            <div key={comment.comment_id} className="comment-home">
              <img src={(comment.selfie || comment.selfie == "undefined") ? comment.selfie : "https://t4.ftcdn.net/jpg/00/65/77/27/360_F_65772719_A1UV5kLi5nCEWI0BNLLiFaBPEkUbv5Fv.jpg"} alt={`${comment.username}'s profile`} className="profile-pic-commenter" />
              <strong className='comment-username'>{comment.username}:</strong> {comment.caption}
            </div>
          ))}
          <h3 onClick={() => setSelected(true)}>See all {comments.length} comments</h3>
        </div>
      </div>
    </div>

  );
}

