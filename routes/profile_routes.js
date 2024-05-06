const { LatexTextSplitter } = require("langchain/text_splitter");
const db = require("../models/db_access.js");

var get_user_posts = async function (req, res) {
    const username = req.params.username;
  
    const search = `WITH num_likes AS (SELECT post_id, COUNT(*) as num_likes FROM likes GROUP BY post_id) SELECT p.*, l.num_likes FROM posts p JOIN users u ON u.user_id = p.author_id JOIN num_likes l ON l.post_id = p.post_id WHERE u.username = "${username}";`;
  
    const result = await db.send_sql(search);
  
    if (result.length == 0) {
      res.status(409).json({ error: "User not found." });
      return;
    }
  
    const posts = result;
  
    res.status(200).json({ result: posts });
  };

  var send_like = async function (req, res) {  
    const username = req.params.username;
    const post_id = req.params.post_id;

    // get user_id of user with username username
    const search = `SELECT user_id FROM users WHERE username = '${username}';`;
    const answer = await db.send_sql(search);
    if (answer.length == 0) {
        res.status(500).json({ error: "Error querying database." });
        return;
    } else {
        req.session.user_id = answer[0].user_id;
    }

    const search2 = `SELECT * FROM likes WHERE user_id = ${req.session.user_id} AND post_id=${post_id};`;
    const answer2 = await db.send_sql(search2);
    if (answer2.length > 0) {
        res.status(409).json({ error: "Already liked." });
        return;
    }

    const insert = `INSERT INTO likes (post_id, user_id) VALUES (${req.params.post_id}, ${req.session.user_id});`;
  
    const result = await db.insert_items(insert);

    if (result > 0) {
      res.status(200).json({ message: "Like sent!" });
      return;
    } else {
        console.log(err);
        res.status(500).json({ error: "Error adding like." });
        return;
      }
};

var create_comment = async function (req, res) {  
  const username = req.params.username;
  const caption = req.body.caption;
  const post_id = req.body.post_id;

  // get user_id of user with username username
  const search = `SELECT user_id FROM users WHERE username = '${username}';`;
  const answer = await db.send_sql(search);
  if (answer.length == 0) {
      res.status(500).json({ error: "Error querying database." });
      return;
  } else {
      req.session.user_id = answer[0].user_id;
  }

  const insert = `INSERT INTO comments (parent_post, caption, author_id) VALUES (${post_id}, ${caption}, ${req.session.user_id});`;

  const result = await db.insert_items(insert);

  if (result > 0) {
    res.status(200).json({ message: "Comment added!" });
    return;
  } else {
      console.log(err);
      res.status(500).json({ error: "Error adding comment." });
      return;
    }
};

var get_comments = async function (req, res) {  
  const post_id = req.params.post_id;

  // get user_id of user with username username
  const search = `SELECT c.*, u.username FROM comments c JOIN users u ON c.author_id = u.user_id WHERE c.parent_post = ${post_id};`;
  const answer = await db.send_sql(search);
  if (answer.length > 0) {

      res.status(200).json({ result: answer });
      return;
  } else {
    res.status(500).json({ message: "There are no comments." });
    return;
  }
}

var get_hashtags = async function (req, res) {  
  const post_id = req.params.post_id;

  // get user_id of user with username username
  const search = `SELECT hashtag FROM post_hashtags WHERE post_id = ${post_id};`;
  const answer = await db.send_sql(search);
  if (answer.length > 0) {
      res.status(200).json({ result: answer });
      return;
  } else {
    res.status(500).json({ message: "There are no hashtags." });
    return;
  }
}

var get_id_post = async function (req, res) {  
  const post_id = req.params.post_id;

  // get user_id of user with username username
  const search = `WITH num_likes AS (SELECT post_id, COUNT(*) as num_likes FROM likes GROUP BY post_id) SELECT p.*, l.num_likes FROM posts p JOIN num_likes l ON l.post_id = p.post_id WHERE p.post_id = '${post_id}';`;
  const answer = await db.send_sql(search);
  if (answer.length > 0) {
      res.status(200).json({ result: answer[0] });
      return;
  } else {
    res.status(500).json({ message: "Post doesn't exist." });
    return;
  }
}


// return true/false if requested
var are_friends_req = async function (req, res) {
  const requester = await get_user_id(req.params.loggedIn);  
  const requestee = await get_user_id(req.params.username);

  // get user_id of user with username username
  const search = `SELECT * FROM friend_requests WHERE requester='${requester}' AND requestee='${requestee}';`;
  console.log(search)
  const answer = await db.send_sql(search);
  if (answer.length > 0) {
    res.status(200).json({ result: true });
    return;
  } else if (answer.length == 0) {
    res.status(200).json({ result: false });
    return;
  } else {
    res.status(500).json({ error: "Error checking request." });
    return;
  }
}

// return true/false if friends
var are_friends = async function (req, res) {
  const requester = await get_user_id(req.params.loggedIn);  
  const requestee = await get_user_id(req.params.username);

  // get user_id of user with username username
  const search = `SELECT * FROM friends WHERE user1_id=${requester} AND user2_id=${requestee};`;
  const answer = await db.send_sql(search);
  if (answer.length > 0) {
    res.status(200).json({ result: true });
    return;
  } else if (answer.length == 0) {
    res.status(200).json({ result: false });
    return;
  } else {
    res.status(500).json({ error: "Error checking friends." });
    return;
  }
}

var get_user_id = async function (username) {
  // get user_id of user with username username
  const search = `SELECT user_id FROM users WHERE username = '${username}';`;
  const answer = await db.send_sql(search);
  if (answer.length == 0) {
      return null;
  } else {
      return answer[0].user_id;
  }
}


  var routes = {
    get_user_posts: get_user_posts,
    send_like: send_like,
    create_comment: create_comment, 
    get_comments: get_comments,
    get_id_post: get_id_post,
    are_friends_req: are_friends_req,
    are_friends: are_friends,
    get_hashtags: get_hashtags

  } 
  
  module.exports = routes;