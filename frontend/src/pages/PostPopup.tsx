import { useState } from "react";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
// import "./App.css";
// import "./Profile.css";
import "./Popup.css";
import React from "react";
import { Post } from "./MyProfile";
import config from '../../config.json';


type Hashtag = {
  hashtag: string;
}

type Comment = {
  comment_id: number;
  parent_post: number;
  caption: string;
  username: number;
  author_id: number;
  time: string;
}

const Comment = ({
  user_id,
  content,
}: {
  user_id: number;
  content: string;
}) => {
  return (
    <div className="comment">
      <h3 className="comment-text">@{user_id}</h3>
      <p>{content}</p>
    </div>
  );
};

const HashtagSection = ({ hashtags }: { hashtags: Hashtag[] }) => {

  console.log(hashtags)
  console.log(Array.isArray(hashtags))
  return (
    <div className="hashtags">
      {Array.isArray(hashtags) && hashtags.map((hashtag) => (
        <span key={hashtag.hashtag}>#{hashtag.hashtag} </span>
      ))}
    </div>
  );
};

const PostPopup = ({
  sourcePost,
  onClick,
}: {
  sourcePost: Post;
  onClick: () => void;
}) => {
  const { username, activeUser } = useParams();
  const [post, setPost] = useState<Post>(sourcePost);
  const [comments, setComments] = useState<Comment[]>([]);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [numLikes, setNumLikes] = useState(0);
  const [liked, setLiked] = useState<boolean>(false);
  const [userStartLike, setUserStartLike] = useState<boolean>(false);
  const tweet = sourcePost.username === "twitteruser";
  const rootURL = config.serverRootURL;

  const fetchData = async () => {

    try {

      try {

        if (tweet) {
          const response = await axios.get(
            `http://localhost:8080/${sourcePost.post_id}/getTweetById`
          );
          setPost(response.data.result[0]);
        } else {
          const response = await axios.get(
            `http://localhost:8080/${sourcePost.post_id}/getPostById`
          );
          setPost(response.data.result[0]);
        }

      } catch (err) {
        console.error("error getting post", err);
      }
      
      try {
        const response2 = await axios.get(
          `http://localhost:8080/${sourcePost.post_id}/getComments`
        );
        setComments(response2.data);
      } catch (err) {
        console.error("error getting comments", err);
      }
      
      
      try {
        const response3 = await axios.get(
          `http://localhost:8080/${sourcePost.post_id}/getHashtags`
        );
        setHashtags(response3.data);

      } catch (err) {
        console.error("error getting hashtags", err);
      }


      try {

        const response4 = await axios.get(
          `http://localhost:8080/${sourcePost.post_id}/${activeUser ? activeUser : username}/getLikedByUser`
        );
  
        setLiked(response4.data);
        setUserStartLike(response4.data);

      } catch (err) {
        console.error("error getting liked status", err);
      }

      try {
        const likesResponse = await axios.get(`${rootURL}/${sourcePost.post_id}/getLikes`);
        setNumLikes(likesResponse.data);
      } catch (error) {
        console.error('Failed to fetch likes:', error);
      }

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLike = async () => {
    try {
      let response;
      if (!liked) {
        response = await axios.post(`${rootURL}/${username}/likePost`, { post_id: post.post_id });
        if (response.status === 201) {
          setNumLikes(numLikes + 1);
          setLiked(true);
        }
      } else {
        console.log(post.post_id)
        response = await axios.post(`${rootURL}/${username}/unlikePost`, { post_id: post.post_id });
        if (response.status === 200) {
          setNumLikes(numLikes - 1);
          setLiked(false);
        }
      }
    } catch (error) {
      console.error('Failed to toggle like on the post:', error);
    }
  };

  const updatePost = async () => {
    // TODO: ONLY CURRENT USER CAN LIKE POSTS --> ADD REACT CONTEXT!!
    if (liked && !userStartLike) {
      try {
        const response = await axios.post(
          `http://localhost:8080/${activeUser ? activeUser : username}/likePost`, {post_id: post.post_id}
        );
      } catch (error) {
        console.error(error);
      }
    } else if (!liked && userStartLike) {
      try {
        const response = await axios.post(
          `http://localhost:8080/${activeUser ? activeUser : username}/unlikePost`, {post_id: post.post_id}
        );
      } catch (error) {
        console.error(error);
      }
    }
    fetchData();
    onClick();
  };

  return (
    <div className="popup display-block">
      <div className="popup-main">
        <div className="container">
          <div className="column">
            <div className="post-image">
              <img src={post.image ? post.image : "https://t4.ftcdn.net/jpg/03/08/43/19/360_F_308431972_g5fuiXwgOZpDCMFQougq13hgSaQVHVro.jpg"} alt="Post" />
            </div>
            <span className = "title-span">
              <div className="post-title section">
                <p>@{post.username}</p>
                <p>{post.caption}</p>
              </div>
            </span>
            <span className="liking-span">
              <div className="section">
                <span className="heart">{numLikes} </span>
                {liked ? (
                  <span className="heart" onClick={() => handleLike()}>
                    ❤️
                  </span>
                ) : (
                  <span className="heart" onClick={() => handleLike()}>
                    🤍
                  </span>
                )}
              </div>
            </span>
            
            <div className="section">
              <HashtagSection hashtags={hashtags} />
            </div>
          </div>
          <div className="column">
            <h3>Comments:</h3>
            <div className="comments section">
              {comments.map((comment) => (
                <Comment
                  key={comment.comment_id}
                  user_id={comment.username}
                  content={comment.caption}
                />
              ))}
            </div>
          </div>
        </div>
        <button
          className="btn btn-success"
          onClick={() => updatePost()}
        >
          {" "}
          Close{" "}
        </button>
      </div>
    </div>
  );
};

export default PostPopup;
