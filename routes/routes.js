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
const config = require("../config.json"); // Load configuration
const bcrypt = require("bcrypt");
const helper = require("../routes/route_helper.js");
const e = require("cors");
const { fromIni } = require("@aws-sdk/credential-provider-ini");
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require('fs').promises;
// // Face Matching imports from app.js
// const { initializeFaceModels, findTopKMatches, client } = require('../basic-face-match/app');
// initializeFaceModels().catch(console.error);

// Database connection setup
const db = dbsingleton;

const PORT = config.serverPort;

async function getS3Object(bucket, objectKey) {

  const credentials = fromIni({
    accessKeyId: "ASIA3I76JENOQ2FJKFKW",
    secretAccessKey: "Df7BnMSAz60fhtdejs/ae8s0gzNr5rhrM2Q0xrZd",
    sessionToken: "IQoJb3JpZ2luX2VjEAYaCXVzLXdlc3QtMiJHMEUCIC3CG6ZBYyI+Qf0GhA7wZvX37r1rHZCzhZTexoh9FqocAiEA0Ak6qnhPVxBiVjpRFcDKAOLvU8wngtkg6iQOX7pciMMqnQIITxABGgw3NzUyMzgwMDE1MDEiDB0l+sGMmYk/wOYOnyr6ARN//ILJmJoS0iV4AVlQ98YgonURpwTFv6+oQHMLq7UYPClD9ws9VFHeI9rdixjOCtpWMKe4pgoDm3Kwaf47iAclxutDzTfmTDmG0dSI+s+4CT1AANM10KCKWUjjxO/oQZ2BbKrndy3Ui1tduQOkqgHAPVYabCBSyHbOdDHY518inwlWcPfk5ViwjXmX4ORXqMGCcuPa1Gl43SSolDB84bhxyim26tdNdtp8dUxnFl24hk963BbFF9XKHAlYKNbgOoQlrh+6ibXLDATAauTMDiZP9LtIh47B+iJW+xeKI8PR/WhIF0LNBnkS2b1uorrk9QG0LG6U9h8QAoQwkoeWsQY6nQEPJOB36yLtUnLicbE+nyI+xbH4N5ASNKRck+erX366GuSevtyGJSLwr3OnIY/H6myjoQDO+W5v510EtJPQeJ0tNtQj5v1p+59Mq8XjjtvERPUWY7GLmF3Kbq4Jb4Gn2t1lLO+HOibnTDyZDcJDc6egoZRb6szqkyJxKEPu64eA0cqwaauWeonXoOYuLLGVAxZQ4hMmJBsI82T38YPd"
  });
  const s3Client = new S3Client({ region: "us-east-1", credentials: credentials });

  // Create the parameters for the GetObjectCommand
  const getObjectParams = {
    Bucket: bucket,
    Key: objectKey,
  };

  // Create a new instance of the GetObjectCommand with the parameters
  const command = new GetObjectCommand(getObjectParams);

  try {
    // Use the S3 client to send the command
    const data = await s3Client.send(command);
    return data.Body;
  } catch (error) {
    console.error("Error fetching object from S3:", error);
    throw error; // Rethrow or handle as needed
  }
}


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
async function uploadImageFileToS3(filePath, s3Bucket, s3Key) {
  try {
    // Read the image file from local filesystem
    const fileContent = await fs.readFile(filePath);

    // Create an instance of the S3 client
    const credentials = fromIni({
      accessKeyId: "ASIA3I76JENOQ2FJKFKW",
      secretAccessKey: "Df7BnMSAz60fhtdejs/ae8s0gzNr5rhrM2Q0xrZd",
      sessionToken: "IQoJb3JpZ2luX2VjEAYaCXVzLXdlc3QtMiJHMEUCIC3CG6ZBYyI+Qf0GhA7wZvX37r1rHZCzhZTexoh9FqocAiEA0Ak6qnhPVxBiVjpRFcDKAOLvU8wngtkg6iQOX7pciMMqnQIITxABGgw3NzUyMzgwMDE1MDEiDB0l+sGMmYk/wOYOnyr6ARN//ILJmJoS0iV4AVlQ98YgonURpwTFv6+oQHMLq7UYPClD9ws9VFHeI9rdixjOCtpWMKe4pgoDm3Kwaf47iAclxutDzTfmTDmG0dSI+s+4CT1AANM10KCKWUjjxO/oQZ2BbKrndy3Ui1tduQOkqgHAPVYabCBSyHbOdDHY518inwlWcPfk5ViwjXmX4ORXqMGCcuPa1Gl43SSolDB84bhxyim26tdNdtp8dUxnFl24hk963BbFF9XKHAlYKNbgOoQlrh+6ibXLDATAauTMDiZP9LtIh47B+iJW+xeKI8PR/WhIF0LNBnkS2b1uorrk9QG0LG6U9h8QAoQwkoeWsQY6nQEPJOB36yLtUnLicbE+nyI+xbH4N5ASNKRck+erX366GuSevtyGJSLwr3OnIY/H6myjoQDO+W5v510EtJPQeJ0tNtQj5v1p+59Mq8XjjtvERPUWY7GLmF3Kbq4Jb4Gn2t1lLO+HOibnTDyZDcJDc6egoZRb6szqkyJxKEPu64eA0cqwaauWeonXoOYuLLGVAxZQ4hMmJBsI82T38YPd"
    });
    const s3Client = new S3Client({ region: "us-east-1", credentials: credentials });

    // Create the PutObject command with necessary parameters
    const putObjectParams = {
      Bucket: s3Bucket,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'image/jpeg' // Set the content type as image/jpeg or as appropriate
    };

    // Execute the PutObject command
    const data = await s3Client.send(new PutObjectCommand(putObjectParams));
    console.log("Image upload successful", data);
  } catch (err) {
    // Handle errors
    console.error("Error during file upload:", err);
    throw err;
  }
}

var uploadPhoto = async function (req, res) {
  const imgName = req.body.imgName;
  uploadImageFileToS3(imgURL, "pennstagram-pics-i-vibe-with-ives", req.params.username)
    .then(() => res.status(201).json({ message: "Upload successful!" }))
    .catch((error) => res.status(400).json({ message: "Upload failed:" }))
}

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
    console.log(err);
    console.log(err);
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
  req.session.username = username;

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

  // if (helper.isLoggedIn(req, username) == false) {
  //   res.status(403).json({ error: "Not logged in." });
  //   return;
  // }

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

  // if (helper.isLoggedIn(req, username) == false) {
  //   res.status(403).json({ error: "Not logged in." });
  //   return;
  // }

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
  console.log("SEND MESSAGE");
  const username = req.params.username;
  const message = req.body.message;
  const chat_name = req.body.chat_name;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    console.log("not logged in");
    return;
  }

  const search = `SELECT user_id FROM users WHERE username = '${username}';`;
  const result = await db.send_sql(search);
  if (result.length == 0) {
    console.log("no user");
    res.status(500).json({ error: "Error querying database." });
    return;
  }
  const user_id = result[0].user_id;
  const search3 = `SELECT group_id FROM \`groups\` WHERE group_name = '${chat_name}';`;
  const result3 = await db.send_sql(search3);

  if (result3.length == 0) {
    console.log("no chat");
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
    console.log("not in chat");
    res.status(403).json({ error: "User is not in chat." });
    return;
  }

  const insert = `INSERT INTO messages (message, sender_id, group_id, timestamp) VALUES ('${message}', '${user_id}', '${chat_id}', NOW());`;
  const result4 = await db.insert_items(insert);
  if (result4 > 0) {
    res.status(201).json({ message: "Message sent." });
    return;
  } else {
    console.log("error");
    res.status(500).json({ error: "Error querying database." });
    return;
  }
};
var get_chats = async function (req, res) {
  // TODO: get all chats of current user
  console.log("GET CHATS");
  const username = req.query.username;
  console.log(username);
  console.log(req.session.username);

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    console.log("not logged in");
    return;
  }

  const search = `
    SELECT \`groups\`.group_id, \`groups\`.group_name
    FROM group_members
    JOIN \`groups\` ON group_members.group_id = \`groups\`.group_id
    JOIN users ON group_members.user_id = users.user_id
    WHERE users.username = '${username}';
`;
  try {
    const result = await db.send_sql(search);
    const formattedData = {
      results: result.map((item) => ({
        name: item.group_name,
        id: item.group_id,
      })),
    };
    console.log(formattedData)
    res.status(200).json(formattedData);
    return;
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error querying database." });
    return;
  }
};


var get_messages = async function (req, res) {
  console.log("GET MESSAGES");
  const username = req.query.username;
  const chat_name = req.query.chat_name;

  console.log(username);
  console.log(chat_name);
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
    console.log(result);
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
    console.log(formattedData);
    res.status(200).json(formattedData);
  } catch (err) {
    console.log(err);
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

  const search = `SELECT * FROM users WHERE username = '${username}';`;

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
  post_logout: postLogout,
  get_friends: getFriends,
  get_friend_recs: getFriendRecs,
  get_movie: getMovie,
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
