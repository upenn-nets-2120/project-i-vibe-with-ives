const { OpenAI, ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const {
  CheerioWebBaseLoader,
} = require("langchain/document_loaders/web/cheerio");

const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const {
  createStuffDocumentsChain,
} = require("langchain/chains/combine_documents");
const { Document } = require("@langchain/core/documents");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { formatDocumentsAsString } = require("langchain/util/document");
const {
  RunnableSequence,
  RunnablePassthrough,
} = require("@langchain/core/runnables");
const { Chroma } = require("@langchain/community/vectorstores/chroma");

const dbsingleton = require("../models/db_access.js");
const config = require("../config.json"); 
const bcrypt = require("bcrypt");
const helper = require("../routes/route_helper.js");

// Database connection setup
const db = dbsingleton;

const PORT = config.serverPort;

var vectorStore = null;

var getHelloWorld = function (req, res) {
  res.status(200).send({ message: "Hello, world!" });
};

var getVectorStore = async function (req) {
  if (vectorStore == null) {
    vectorStore = await Chroma.fromExistingCollection(new OpenAIEmbeddings(), {
      collectionName: "imdb_reviews2",
      url: "http://localhost:8000", // Optional, will default to this value
    });
  }
  return vectorStore;
};

// POST /register
var postRegister = async function (req, res) {
  // TODO: register a user with given body parameters
  // get username, password, and linked_id from body paramters
  const username = req.body.username;
  const password = req.body.password;
  const linked_nconst = req.body.linked_nconst;

  console.log(username);
  console.log(password);
  console.log(linked_nconst);

  // throw 400 error if any of username, password, lnked_id is empty
  if (!username || !password || !linked_nconst) {
    res.status(400).json({
      error:
        "One or more of the fields you entered was empty, please try again.",
    });
    return;
  }

  // if user with same username already exists in database, throw 409 error
  const search = `SELECT * FROM users WHERE username = '${username}';`;
  console.log(search);
  try {
    const result = await db.send_sql(search);
    if (result.length > 0) {
      res.status(409).json({
        error:
          "An account with this username already exists, please try again.",
      });
      return;
    } else {
      helper.encryptPassword(password, async function (err, hash) {
        if (err) {
          res.status(400).json({ message: "Error encrypting password" });
          return;
        } else {
          // insert into users table
          // if user with same username already exists in database, throw 409 error
          const insert = `INSERT INTO users (username, hashed_password, linked_nconst) VALUES ('${username}', '${hash}', '${linked_nconst}');`;
          // try catch and await call

          const result = await db.insert_items(insert);
          if (result > 0) {
            res.status(200).json({ username: username });
            req.session.username = username;
            return;
          } else {
            console.log("second");
            console.log(err);
            res.status(500).json({ error: "Error querying database." });
            return;
          }
        }
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error querying database." });
    return;
  }
};

// POST /login
var postLogin = async function (req, res) {
  // TODO: check username and password and login
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    res.status(400).json({
      error:
        "One or more of the fields you entered was empty, please try again.",
    });
    return;
  }

  const search = `SELECT * FROM users WHERE username = "${username}";`;
  console.log(search);

  try {
    const result = await db.send_sql(search);
    console.log(result);
    if (result.length == 0) {
      res.status(401).json({ error: "Username and/or password are invalid." });
      return;
    } else {
      const hash = result[0].hashed_password;
      const match = await bcrypt.compare(password, hash);
      console.log(password);
      console.log(hash);
      console.log(match);
      if (match) {
        req.session.user_id = result[0].user_id;
        req.session.username = result[0].username;
        return res.status(200).json({ username: username });
      }
      res.status(401).json({
        error: "Username and/or password are invalid.",
      });
      return;
    }
  } catch (err) {
    res.status(500).json({ error: "Error querying database." });
    return;
  }
};

// GET /logout
var postLogout = function (req, res) {
  // set session user_id to null
  try {
    req.session.user_id = null;
    req.session.username = null;
  } catch (err) {
    console.log(err);
  }

  return;
};

// GET /friends
var getFriends = async function (req, res) {
  // TODO: get all friends of current user

  console.log(req.session);
  const username = req.params.username;
  // req.session.username = username;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  const search = `SELECT u2.username AS friend_username
  FROM users u1
  JOIN friends f ON u1.user_id = f.user1_id
  JOIN users u2 ON f.user2_id = u2.user_id
  WHERE u1.username = "${username}"
  UNION
  SELECT u3.username AS friend_username
  FROM users u1
  JOIN friends f ON u1.user_id = f.user2_id
  JOIN users u3 ON f.user1_id = u3.user_id
  WHERE u1.username = "${username}";`;

  const results = await db.send_sql(search);

  const formattedData = {
    results: results.map((item) => ({
      friend_username: item.friend_username,
    })),
  };

  res.status(200).json(formattedData);
};

var post_request_friend = async function (req, res) {
  const username = req.body.username;
  const friend = req.body.friend;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  const search = `SELECT user_id FROM users WHERE username = '${username}';`;
  const result = await db.send_sql(search);

  if (result.length == 0) {
    res.status(500).json({ error: "Error querying database." });
    return;
  }

  const user_id = result[0].user_id;

  const search2 = `SELECT user_id FROM users WHERE username = '${friend}';`;

  const result2 = await db.send_sql(search2);

  if (result2.length == 0) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  const friend_id = result2[0].user_id;

  const insert = `INSERT INTO friend_requests (requester, requestee) VALUES ('${user_id}', '${friend_id}');`;

  const result3 = await db.insert_items(insert);

  if (result3 > 0) {
    res.status(201).json({ message: "Friend request sent." });
    return;
  }

  return res.status(500).json({ error: "Error querying database." });
};

var post_accept_friend = async function (req, res) {
  const username = req.body.username;
  const friend = req.body.friend;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  const search = `SELECT user_id FROM users WHERE username = '${username}';`;
  const result = await db.send_sql(search);

  if (result.length == 0) {
    res.status(500).json({ error: "Error querying database." });
    return;
  }

  const user_id = result[0].user_id;

  const search2 = `SELECT user_id FROM users WHERE username = '${friend}';`;

  const result2 = await db.send_sql(search2);

  if (result2.length == 0) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  const friend_id = result2[0].user_id;

  const delete_query = `DELETE FROM friend_requests WHERE requester = '${friend_id}' AND requestee = '${user_id}';`;

  const result3 = await db.insert_items(delete_query);

  if (result3 > 0) {
    const insert = `INSERT INTO friends (user1_id, user2_id) VALUES ('${user_id}', '${friend_id}');`;

    const result4 = await db.insert_items(insert);

    if (result4 > 0) {
      res.status(201).json({ message: "Friend added." });
      return;
    }
  }

  return res.status(500).json({ error: "Error querying database." });
};

var post_remove_friend = async function (req, res) {
  const username = req.body.username;
  const friend = req.body.friend;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  const search = `SELECT user_id FROM users WHERE username = '${username}';`;
  const result = await db.send_sql(search);

  if (result.length == 0) {
    res.status(500).json({ error: "Error querying database." });
    return;
  }

  const user_id = result[0].user_id;

  const search2 = `SELECT user_id FROM users WHERE username = '${friend}';`;

  const result2 = await db.send_sql(search2);

  if (result2.length == 0) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  const friend_id = result2[0].user_id;
  const delete_query = `DELETE FROM friends WHERE (user1_id, user2_id) IN ((${user_id}, ${friend_id}), (${friend_id}, ${user_id}));`;

  const result3 = await db.insert_items(delete_query);

  if (result3 > 0) {
    res.status(201).json({ message: "Friend removed." });
    return;
  }

  return res.status(500).json({ error: "Error querying database." });
};

// GET /recommendations
var getFriendRecs = async function (req, res) {
  // TODO: get all friend recommendations of current user
  const username = req.params.username;
  // req.session.username = username;

  if (!helper.isOK(username) || helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  const search = `SELECT recommendations.recommendation, names.primaryName FROM users JOIN recommendations ON users.linked_nconst = recommendations.person JOIN names ON recommendations.recommendation = names.nconst WHERE users.username = '${username}';`;

  try {
    const result = await db.send_sql(search);
    const formattedData = {
      results: result.map((item) => ({
        recommendation: item.recommendation,
        primaryName: item.primaryName,
      })),
    };
    res.status(200).json(formattedData);
  } catch (err) {
    res.status(500).json({ error: "Error querying database." });
    return;
  }
};

// POST /createPost
var createPost = async function (req, res) {
  // TODO: add to posts table
  const title = req.body.title;
  const content = req.body.content;
  let parent_id = req.body.parent_id;

  const username = req.params.username;
  // req.session.username = username;
  // req.session.user_id = 8;

  if (!parent_id) {
    parent_id = 0;
  }

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  if (!title || !content || !helper.isOK(title) || !helper.isOK(content)) {
    res.status(400).json({
      error:
        "One or more of the fields you entered was empty, please try again.",
    });
    return;
  }

  // get user_id of user with username username
  const search = `SELECT user_id FROM users WHERE username = '${username}';`;
  const answer = await db.send_sql(search);
  if (answer.length == 0) {
    res.status(500).json({ error: "Error querying database." });
    return;
  } else {
    req.session.user_id = answer[0].user_id;
  }

  const insert = `INSERT INTO posts (title, content, author_id, parent_post) VALUES ('${title}', '${content}', '${req.session.user_id}', '${parent_id}');`;
  const result = await db.insert_items(insert);
  if (result > 0) {
    res.status(201).json({ message: "Post created." });
    return;
  } else {
    res.status(500).json({ error: "Error querying database." });
    return;
  }
};

// GET /feed
var getFeed = async function (req, res) {
  // TODO: get the correct posts to show on current user's feed
  // get all posts from users that the current user follows and their own posts
  const username = req.params.username;
  req.session.username = username;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  // get user_id of user with username username
  const initSearch = `SELECT user_id FROM users WHERE username = '${username}';`;
  try {
    const result = await db.send_sql(initSearch);
    if (result.length == 0) {
      console.log("first");
      res.status(500).json({ error: "Error querying database." });
      return;
    } else {
      req.session.user_id = result[0].user_id;
      req.session.linked_id = result[0].linked_nconst;
    }
  } catch (err) {
    console.log("second");
    console.log(err);
    res.status(500).json({ error: "Error querying database." });
    return;
  }

  //get user id of all users that the current user follows and themselves
  const search = ` WITH feed_users AS (SELECT users.user_id, users.username FROM users JOIN friends ON users.linked_nconst = friends.followed WHERE friends.follower = '${req.session.linked_id}' UNION SELECT user_id, username FROM users WHERE user_id = '${req.session.user_id}') 
    SELECT f.username, posts.parent_post, posts.title, posts.content FROM feed_users f JOIN posts ON f.user_id = posts.author_id;`;

  try {
    const result = await db.send_sql(search);
    const formattedData = {
      results: result.map((item) => ({
        username: item.username,
        parent_post: item.parent_post,
        title: item.title,
        content: item.content,
      })),
    };
    res.status(200).json(formattedData);
  } catch (err) {
    console.log("third");
    res.status(500).json({ error: "Error querying database." });
    return;
  }
};

var create_chat = async function (req, res) {
  const people = req.body.people;
  const name = req.body.name;

  const search = `SELECT * FROM \`groups\` WHERE group_name = "${name}";`;
  const result = await db.send_sql(search);
  if (result.length > 0) {
    res.status(409).json({ error: "Chat with this name already exists." });
    return;
  }
  try {
    const insert = `INSERT INTO \`groups\` (group_name) VALUES ('${name}');`;
    const result2 = await db.insert_items(insert);

    const group_id_result = await db.send_sql(search);
    const group_id = group_id_result[0].group_id;

    const user_ids_query = `SELECT user_id FROM users WHERE username IN (${people
      .map((person) => `'${person}'`)
      .join(", ")});`;
    const user_ids_result = await db.send_sql(user_ids_query);

    const user_ids = user_ids_result.map((user) => user.user_id);

    if (result2 > 0) {
      user_ids.forEach(async (user_id) => {
        const insert2 = `INSERT INTO group_members (group_id, user_id) VALUES ('${group_id}', '${user_id}');`;
        await db.insert_items(insert2);
      });
    }
  } catch (err) {
    res.status(500).json({ error: "Error querying database." });
    return;
  }
  res.status(201).json({ message: "Chat created." });
};

var post_send_message = async function (req, res) {
  const username = req.params.username;
  const message = req.body.message;
  const chat_name = req.body.chat_name;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  const search = `SELECT user_id FROM users WHERE username = '${username}';`;
  const result = await db.send_sql(search);
  if (result.length == 0) {
    res.status(500).json({ error: "Error querying database." });
    return;
  }
  const user_id = result[0].user_id;
  console.log("USERID");
  console.log(user_id);
  const search3 = `SELECT group_id FROM \`groups\` WHERE group_name = '${chat_name}';`;
  const result3 = await db.send_sql(search3);
  console.log(result3);

  if (result3.length == 0) {
    res.status(404).json({ error: "Chat not found." });
    return;
  }
  const chat_id = result3[0].group_id;
  console.log("CHATID");
  console.log(chat_id);
  // check if user is in chat
  const search2 = `SELECT * FROM group_members WHERE user_id = '${user_id}' AND group_id = '${chat_id}';`;
  const result2 = await db.send_sql(search2);
  if (result2.length == 0) {
    res.status(403).json({ error: "User is not in chat." });
    return;
  }

  const insert = `INSERT INTO messages (message, sender_id, group_id, timestamp) VALUES ('${message}', '${user_id}', '${chat_id}', NOW());`;
  const result4 = await db.insert_items(insert);
  if (result4 > 0) {
    res.status(201).json({ message: "Message sent." });
    return;
  } else {
    res.status(500).json({ error: "Error querying database." });
    return;
  }
};
var get_chats = async function (req, res) {
  // TODO: get all chats of current user
  const username = req.body.username;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  const search = `SELECT group_name FROM group_members JOIN \`groups\` ON group_members.group_id = \`groups\`.group_id JOIN users ON group_members.user_id = users.user_id WHERE users.username = '${username}';`;
  try {
    const result = await db.send_sql(search);
    const formattedData = {
      results: result.map((item) => ({
        group_name: item.group_name,
      })),
    };

    res.status(200).json(formattedData);
  } catch (err) {
    res.status(500).json({ error: "Error querying database." });
    return;
  }
};

var get_messages = async function (req, res) {
  const username = req.body.username;
  const chat_name = req.body.chat_name;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  const search = `
    SELECT u.username, m.message, m.timestamp
    FROM users u
    JOIN group_members gm ON u.user_id = gm.user_id
    JOIN \`groups\` g ON gm.group_id = g.group_id
    JOIN messages m ON g.group_id = m.group_id AND u.user_id = m.sender_id
    WHERE u.username = '${username}' AND g.group_name = '${chat_name}';
  `;
  try {
    const result = await db.send_sql(search);
    const formattedData = {
      results: result.map((item) => ({
        username: item.username,
        message: item.message,
        timestamp: item.timestamp,
      })),
    };
    // sort by timestamp
    formattedData.results.sort((a, b) => {
      return a.timestamp - b.timestamp;
    });
    res.status(200).json(formattedData);
  } catch (err) {
    res.status(500).json({ error: "Error querying database." });
    return;
  }
};
var post_leave_chat = async function (req, res) {
  const username = req.body.username;
  const chat_name = req.body.chat_name;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  const search = `SELECT user_id FROM users WHERE username = '${username}';`;
  const result = await db.send_sql(search);

  if (result.length == 0) {
    res.status(500).json({ error: "Error querying database." });
    return;
  }

  const user_id = result[0].user_id;

  const search2 = `SELECT group_id FROM \`groups\` WHERE group_name = '${chat_name}';`;
  const result2 = await db.send_sql(search2);

  if (result2.length == 0) {
    res.status(404).json({ error: "Chat not found." });
    return;
  }

  const chat_id = result2[0].group_id;

  const search3 = `SELECT * FROM group_members WHERE user_id = '${user_id}' AND group_id = '${chat_id}';`;
  const result3 = await db.send_sql(search3);

  if (result3.length == 0) {
    res.status(403).json({ error: "User is not in chat." });
    return;
  }

  const delete_query = `DELETE FROM group_members WHERE user_id = '${user_id}' AND group_id = '${chat_id}';`;
  const result4 = await db.insert_items(delete_query);

  if (result4 > 0) {
    res.status(201).json({ message: "User left chat." });
    return;
  }

  return res.status(500).json({ error: "Error querying database." });
};

var post_invite_member = async function (req, res) {
  const username = req.body.username;
  const chat_name = req.body.chat_name;
  const invitee = req.body.invitee;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  const search = `SELECT user_id FROM users WHERE username = '${username}';`;
  const result = await db.send_sql(search);

  if (result.length == 0) {
    res.status(500).json({ error: "Error querying database." });
    return;
  }

  const user_id = result[0].user_id;

  const search2 = `SELECT group_id FROM \`groups\` WHERE group_name = '${chat_name}';`;
  const result2 = await db.send_sql(search2);

  if (result2.length == 0) {
    res.status(404).json({ error: "Chat not found." });
    return;
  }

  const search3 = `SELECT * FROM group_members WHERE user_id = '${user_id}' AND group_id = '${result2[0].group_id}';`;
  const result3 = await db.send_sql(search3);

  if (result3.length == 0) {
    res.status(403).json({ error: "User is not in chat." });
    return;
  }

  const chat_id = result2[0].group_id;

  const search4 = `SELECT user_id FROM users WHERE username = '${invitee}';`;
  const result4 = await db.send_sql(search4);

  if (result3.length == 0) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  const invitee_id = result4[0].user_id;

  const insert = `INSERT INTO invites (group_id, user_id) VALUES ('${chat_id}', '${invitee_id}');`;
  const result5 = await db.insert_items(insert);

  if (result5 > 0) {
    res.status(201).json({ message: "Invite sent." });
    return;
  }
  return res.status(500).json({ error: "Error querying database." });
};

var post_join_chat = async function (req, res) {
  const username = req.body.username;
  const chat_name = req.body.chat_name;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  const search = `SELECT user_id FROM users WHERE username = '${username}';`;
  const result = await db.send_sql(search);

  if (result.length == 0) {
    res.status(500).json({ error: "Error querying database." });
    return;
  }

  const user_id = result[0].user_id;

  const search2 = `SELECT group_id FROM \`groups\` WHERE group_name = '${chat_name}';`;
  const result2 = await db.send_sql(search2);

  if (result2.length == 0) {
    res.status(404).json({ error: "Chat not found." });
    return;
  }

  const chat_id = result2[0].group_id;

  const search3 = `SELECT * FROM invites WHERE user_id = '${user_id}' AND group_id = '${chat_id}';`;

  const result3 = await db.send_sql(search3);

  if (result3.length == 0) {
    res.status(403).json({ error: "User is not invited to chat." });
    return;
  }

  const insert = `INSERT INTO group_members (group_id, user_id) VALUES ('${chat_id}', '${user_id}');`;
  const result4 = await db.insert_items(insert);

  if (result4 > 0) {
    res.status(201).json({ message: "User joined chat." });
    return;
  }

  return res.status(500).json({ error: "Error querying database." });
};
// HERE
var post_add_hashtag = async function (req, res) {
  const username = req.body.username;
  const hashtag = req.body.hashtag;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  const search = `SELECT user_id FROM users WHERE username = '${username}';`;
  const result = await db.send_sql(search);

  if (result.length == 0) {
    res.status(500).json({ error: "Error querying database." });
    return;
  }

  const user_id = result[0].user_id;

  const insert = `INSERT INTO user_hashtags (user_id, hashtag) VALUES ('${user_id}', '${hashtag}');`;

  const result2 = await db.insert_items(insert);

  if (result2 > 0) {
    res.status(201).json({ message: "Hashtag added." });
    return;
  }

  return res.status(500).json({ error: "Error querying database." });
};

var post_remove_hashtag = async function (req, res) {
  const username = req.body.username;
  const hashtag = req.body.hashtag;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  const search = `SELECT user_id FROM users WHERE username = '${username}';`;
  const result = await db.send_sql(search);

  if (result.length == 0) {
    res.status(500).json({ error: "Error querying database." });
    return;
  }

  const user_id = result[0].user_id;

  const delete_query = `DELETE FROM user_hashtags WHERE user_id = '${user_id}' AND hashtag = '${hashtag}';`;

  const result2 = await db.insert_items(delete_query);

  if (result2 > 0) {
    res.status(201).json({ message: "Hashtag removed." });
    return;
  }

  return res.status(404).json({ error: "Hashtag not found." });
};

var post_set_email = async function (req, res) {
  const username = req.body.username;
  const email = req.body.email;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  // update email where username = username
  const update = `UPDATE users SET email = '${email}' WHERE username = '${username}';`;

  const result = await db.insert_items(update);

  if (result > 0) {
    res.status(201).json({ message: "Email set." });
    return;
  }

  return res.status(500).json({ error: "Error querying database." });
};

var post_set_password = async function (req, res) {
  const username = req.params.username;
  const password = req.body.password;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  // update password where username = username
  helper.encryptPassword(password, async function (err, hash) {
    if (err) {
      res.status(400).json({ message: "Error encrypting password" });
      return;
    } else {
      const update = `UPDATE users SET hashed_password = '${hash}' WHERE username = '${username}';`;

      const result = await db.insert_items(update);

      if (result > 0) {
        res.status(201).json({ message: "Password set." });
        return;
      } else {
        res.status(500).json({ error: "Error querying database." });
        return;
      }
    }
  });
};

var get_profile = async function (req, res) {
  const username = req.params.username;

  const search = `SELECT * FROM users WHERE username = "${username}";`;

  const result = await db.send_sql(search);

  if (result.length == 0) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  const user = result[0];

  res.status(200).json({ result: user });
};

var getMovie = async function (req, res) {
  const vs = await getVectorStore();
  const retriever = vs.asRetriever();

  const username = req.params.username;
  req.session.username = username;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  const prompt = PromptTemplate.fromTemplate(`${req.body.question}`);
  const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-3.5-turbo",
  });

  const ragChain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  console.log(req.body.question);

  result = await ragChain.invoke(req.body.question);
  console.log(result);
  res.status(200).json({ message: result });
};

/* Here we construct an object that contains a field for each route
   we've defined, so we can call the routes from app.js. */

var routes = {
  get_helloworld: getHelloWorld,
  post_login: postLogin,
  post_register: postRegister,
  post_logout: postLogout,
  get_friends: getFriends,
  get_friend_recs: getFriendRecs,
  get_movie: getMovie,
  create_post: createPost,
  get_feed: getFeed,
  post_create_chat: create_chat,
  post_send_message: post_send_message,
  get_chats: get_chats,
  get_messages: get_messages,
  post_leave_chat: post_leave_chat,
  post_invite_member: post_invite_member,
  post_join_chat: post_join_chat,
  post_add_hashtag: post_add_hashtag,
  post_remove_hashtag: post_remove_hashtag,
  post_set_email: post_set_email,
  post_set_password: post_set_password,
  get_profile: get_profile,
  post_request_friend: post_request_friend,
  post_accept_friend: post_accept_friend,
  post_remove_friend: post_remove_friend,
};

module.exports = routes;
