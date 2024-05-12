const { LatexTextSplitter } = require("langchain/text_splitter");
const db = require("../models/db_access.js");

var get_user_posts = async function (req, res) {
  const username = req.params.username;

  const search = `WITH num_likes AS (SELECT post_id, COUNT(*) as num_likes FROM likes GROUP BY post_id) SELECT p.*, l.num_likes FROM posts p JOIN users u ON u.user_id = p.author_id LEFT JOIN num_likes l ON l.post_id = p.post_id WHERE u.username = "${username}";`;

  const result = await db.send_sql(search);

  if (result.length == 0) {
    res.status(200).json({ message: "No posts yet for this user." });
    return;
  }

  const posts = result;


  const formattedData = {
    result: posts.map((item) => ({
      post_id: item.post_id,
      caption: item.caption,
      author_id: item.author_id,
      image: item.image,
      time: item.time,
      num_likes: item.num_likes == null ? 0 : item.num_likes,
    })),
  };

  res.status(200).json(formattedData);

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

// var create_comment = async function (req, res) {
//   const username = req.params.username;
//   const caption = req.body.caption;
//   const post_id = req.body.post_id;

//   // get user_id of user with username username
//   const search = `SELECT user_id FROM users WHERE username = '${username}';`;
//   const answer = await db.send_sql(search);
//   if (answer.length == 0) {
//     res.status(500).json({ error: "Error querying database." });
//     return;
//   } else {
//     req.session.user_id = answer[0].user_id;
//   }

//   const insert = `INSERT INTO comments (parent_post, caption, author_id) VALUES (${post_id}, ${caption}, ${req.session.user_id});`;

//   const result = await db.insert_items(insert);

//   if (result > 0) {
//     res.status(200).json({ message: "Comment added!" });
//     return;
//   } else {
//     console.log(err);
//     res.status(500).json({ error: "Error adding comment." });
//     return;
//   }
// };

// var get_comments = async function (req, res) {
//   const post_id = req.params.post_id;

//   // get user_id of user with username username
//   const search = `SELECT c.*, u.username FROM comments c JOIN users u ON c.author_id = u.user_id WHERE c.parent_post = ${post_id};`;
//   const answer = await db.send_sql(search);
//   if (answer.length > 0) {

//     res.status(200).json({ result: answer });
//     return;
//   } else {
//     res.status(500).json({ message: "There are no comments." });
//     return;
//   }
// }


var get_id_post = async function (req, res) {
  const post_id = req.params.post_id;

  // get user_id of user with username username
  const search = `WITH num_likes AS (SELECT post_id, COUNT(*) as num_likes FROM likes GROUP BY post_id) SELECT p.*, l.num_likes FROM posts p LEFT JOIN num_likes l ON l.post_id = p.post_id WHERE p.post_id = '${post_id}';`;
  const answer = await db.send_sql(search);
  if (answer.length > 0) {
    const formattedData = {
      result: answer.map((item) => ({
        post_id: item.post_id,
        caption: item.caption,
        author_id: item.author_id,
        image: item.image,
        time: item.time,
        num_likes: item.num_likes == null ? 0 : item.num_likes,
      })),
    };
    res.status(200).json(formattedData);

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

var get_linked_actor = async function (req, res) {
  const linked_nconst = req.body.linked_nconst;  
  console.log(linked_nconst);
  
  const insert = `SELECT primaryName from names where nconst = '${linked_nconst}';`;
  try {
      const result = await db.send_sql(insert);
      if (result.length > 0) {
          res.status(200).json({ actor :  result[0].primaryName });
          return;
      } else {
          res.status(500).json({ error: "Error querying database." });
          return;
      }
  } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Error querying database." });
      return;
  }
};


var routes = {
  get_user_posts: get_user_posts,
  send_like: send_like,
  get_id_post: get_id_post,
  are_friends_req: are_friends_req,
  are_friends: are_friends,
  getLinkedActor: get_linked_actor
}

module.exports = routes;