import { useState } from "react";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
// import "./App.css";
import "./Profile.css";
import "./Popup.css";
import React from "react";
import { Post } from "./MyProfile";

interface Hashtag {
  hashtag: string;
}

interface Comment {
  comment_id: number;
  username: number;
  caption: string;
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
      <h3 className="comment-text">@ {user_id}</h3>
      <p>{content}</p>
    </div>
  );
};

const HashtagSection = ({ hashtags }: { hashtags: Hashtag[] }) => {
  return (
    <div className="hashtags">
      {hashtags.map((hashtag) => (
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
  const { username } = useParams();
  const [post, setPost] = useState<Post>(sourcePost);
  const [comments, setComments] = useState<Comment[]>([]);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [liked, setLiked] = useState<boolean>(false);
  const [numLikes, setNumLikes] = useState<number | null>(sourcePost.num_likes);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/${sourcePost.post_id}/getPostById`
      );
      setPost(response.data.result);

      const response2 = await axios.get(
        `http://localhost:8080/${sourcePost.post_id}/getComments`
      );
      setComments(response2.data.result);

      const response3 = await axios.get(
        `http://localhost:8080/${sourcePost.post_id}/getHashtags`
      );
      setHashtags(response3.data.result);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLike = () => {
    if (liked && numLikes) setNumLikes(numLikes - 1);
    else if (!liked && numLikes) setNumLikes(numLikes + 1);
    setLiked(!liked);
  };

  const updatePost = async () => {
    // TODO: ONLY CURRENT USER CAN LIKE POSTS --> ADD REACT CONTEXT!!
    if (liked) {
      try {
        const response = await axios.post(
          `http://localhost:8080/${username}/${post.post_id}/sendLike`
        );
      } catch (error) {
        console.error(error);
      }
    }
    onClick();
  };

  return (
    <div className="popup display-block">
      <div className="popup-main">
        <div className="container">
          <div className="column">
            <div className="post-image section">
              <img src={post.image ? post.image : undefined} alt="Post" />
            </div>
          </div>
          <div className="column">
            <div className="section">
              <p>@ {username}</p>
              <p>{post.caption}</p>
            </div>
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
            <div className="section">
              <HashtagSection hashtags={hashtags} />
            </div>
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
