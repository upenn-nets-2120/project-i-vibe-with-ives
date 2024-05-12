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
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const fs = require("fs").promises;
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//impost process.env
require("dotenv").config();

// // Face Matching imports from app.js
// const {
//   initializeFaceModels,
//   findTopKMatches,
//   client,
// } = require("../basic-face-match/app");
// initializeFaceModels().catch(console.error);

// Database connection setup
const db = dbsingleton;

const PORT = config.serverPort;

async function getS3Object(bucket, objectKey) {
  const credentials = fromIni({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AUTH_TOKEN,
  });
  const s3Client = new S3Client({
    region: "us-east-1",
    credentials: credentials,
  });

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
    console.log(data.Body);
    return data.Body;
  } catch (error) {
    console.error("Error fetching object from S3:", error);
    throw error; // Rethrow or handle as needed
  }
}

async function uploadImageFileToS3(filePath, s3Bucket, s3Key) {
  try {
    // Read the image file from local filesystem
    const fileContent = await fs.readFile(filePath);
    // Create an instance of the S3 client
    let credentials = fromIni({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AUTH_TOKEN,
    });

    const s3Client = new S3Client({
      region: "us-east-1",
      credentials: credentials,
    });

    // Create the PutObject command with necessary parameters
    const putObjectParams = {
      Bucket: s3Bucket,
      Key: s3Key,
      Body: fileContent,
      ContentType: "image/jpeg", // Set the content type as image/jpeg or as appropriate
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

var uploadProfilePhoto = async function (req, res) {
  const imgName = req.file;
  //   const imgName = "frontend/golden-retriever-personality-1024x739.jpeg";
  await uploadImageFileToS3(
    imgName.path,
    "pennstagram-pics-i-vibe-with-ives",
    req.params.username
  )
    .then(() => {
      res.status(201).json({ message: "Upload successful!" });
      return;
    })
    .catch((error) =>
      res.status(400).json({ message: "Upload failed:" + error })
    );
};

// directly returns the image
// var getProfilePhoto = async function (req,res) {
//     const username = req.params.username;
//     try {
//         const dataStream = await getS3Object("pennstagram-pics-i-vibe-with-ives", username);
//         // Set the appropriate content type, e.g., 'image/jpeg'
//         res.setHeader('Content-Type', 'image/jpeg');
//         dataStream.pipe(res);
//     } catch (err) {
//         res.status(400).json({message: "Failed to get photo" + err.message})
//     }
//   }

// gets the s3 link to the image
var getProfilePhoto = async function (req, res) {
  const username = req.params.username;
  try {
    const imageUrl = `https://pennstagram-pics-i-vibe-with-ives.s3.amazonaws.com/${username}`;
    res.status(200).json({ imageUrl: imageUrl });
    return;
  } catch (err) {
    res.status(400).json({ message: "Failed to get photo" + err.message });
    return;
  }
};

// POST /createPost
var createPost = async function (req, res) {
  // TODO: add to posts table
  console.log("creating post with")
  console.log(req)
  const username = req.params.username;
  const caption = req.body.caption;
  const imageUrl = req.file;
  const hashtags = req.body.hashtags;
  // console.log(imageUrl);
  // req.session.username = username;
  // req.session.user_id = 8;

  // if (helper.isLoggedIn(req, username) == false) {
  //   res.status(403).json({ error: "Not logged in." });
  //   return;
  // }
  if ((!caption && !imageUrl && !hashtags) || !helper.isOK(caption)) {
    res.status(400).json({
      error: "Please input at least one field.",
    });
    return;
  }

  try {
    // get user_id of user with username username
    const search = `SELECT user_id FROM users WHERE username = '${username}';`;
    const answer = await db.send_sql(search);
    if (answer.length == 0) {
      res.status(500).json({ error: "Error finding user." });
      return;
    } else {
      req.session.user_id = answer[0].user_id;
    }
    let insert;

    if (caption) {
      insert = `INSERT INTO posts (caption, author_id) VALUES ('${caption}', ${req.session.user_id});`;
    } else {
      insert = `INSERT INTO posts (author_id) VALUES (${req.session.user_id});`;
    }
    const result = await db.send_sql(insert);
    const post_id = result.insertId.toString();

    if (imageUrl) {
      uploadImageFileToS3(
        imageUrl.path,
        "pennstagram-pics-i-vibe-with-ives",
        post_id
      ).then(() => console.log("updated"));
      const updatePostQuery = `UPDATE posts SET image = "https://pennstagram-pics-i-vibe-with-ives.s3.amazonaws.com/${post_id}" WHERE post_id = ${post_id}`;
      const ans = await db.send_sql(updatePostQuery);
    }
    if (hashtags) {
      const hashtagArray = hashtags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");
      for (let tag of hashtagArray) {
        const insertHashtag = `INSERT INTO post_hashtags (post_id, hashtag) VALUES ('${post_id}', '${tag}');`;
        await db.send_sql(insertHashtag);
      }
    }
    res.status(201).json({ message: "Post uploaded!" });
  } catch (err) {
    res.status(500).json({ error: "Error querying database." + err });
  }
};

// GET /feed
var getFeed = async function (req, res) {
  // TODO: get the correct posts to show on current user's feed
  // get all posts from users that the current user follows and their own posts
  const username = req.params.username;
  // req.session.username = username;

  // if (helper.isLoggedIn(req, username) == false) {
  //   res.status(403).json({ error: "Not logged in." });
  //   return;
  // }

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
  //   const search = ` WITH feed_users AS (SELECT users.user_id, users.username FROM users JOIN friends ON users.linked_nconst = friends.followed WHERE friends.follower = '${req.session.linked_id}' UNION SELECT user_id, username FROM users WHERE user_id = '${req.session.user_id}')
  //     SELECT f.username, posts.parent_post, posts.title, posts.content FROM feed_users f JOIN posts ON f.user_id = posts.author_id;`;

  const search = `SELECT DISTINCT p.post_id, p.caption, p.time, p.author_id, u.username, p.image FROM posts p LEFT JOIN users u ON p.author_id = u.user_id ORDER BY p.time DESC;`;

  const tweetSearch = `SELECT DISTINCT id as post_id, text as caption, created_at as time, author_id FROM tweets ORDER BY created_at DESC;`;
  try {
    const result = await db.send_sql(search);
    const tweetResult = await db.send_sql(tweetSearch);

    function formatItem(item) {
      return {
        post_id: item.post_id,
        caption: item.caption,
        time: item.time,
        author_id: item.author_id,
        username: item.username ? item.username : "twitter_user",
        image: item.image ? item.image : null,
      };
    }

    // Map both results and tweet results to the formatted structure
    const formattedResult = result.map(formatItem);
    const formattedTweetResult = tweetResult.map(formatItem);

    // Combine both arrays into one
    const formattedData = {
      results: [...formattedResult, ...formattedTweetResult],
    };

    res.status(200).json(formattedData);
    return;
  } catch (err) {
    console.log("third");
    res.status(500).json({ error: "Error querying database." + err });
    return;
  }

  /* 
  
    quoted_tweet_id: null,
    hashtags: [],
    created_at: 1715196063000,
    replied_to_tweet_id: null,
    quotes: 1,
    urls: 'https://ew.com/steve-albini-dead-producer-nirvana-pixies-90s-rock-8645467?taid=663bd09e2692da0001c0e5f3&utm_campaign=entertainmentweekly_entertainmentweekly&utm_content=new&utm_medium=social&utm_source=twitter.com',
    replies: 2,
    conversation_id: 1788288019033731300,
    mentions: [],
    id: 1788288019033731300,
    text: "Steve Albini, a musician and an audio engineer for bands like Nirvana and Pixies who helped define the sound of '90s alternative rock, has died at 61. https://t.co/YUJ1cNx90s",
    author_id: 16312576,
    retweets: 9,
    retweet_id: null,
    likes: 52
  
  
  */
};

var likePost = async function (req, res) {
  // TODO: add to posts table
  const username = req.params.username;
  const user_id = await get_user_id(username);
  const post_id = req.body.post_id;

  // req.session.username = username;
  // req.session.user_id = 8;

  // if (helper.isLoggedIn(req, username) == false) {
  //   res.status(403).json({ error: "Not logged in." });
  //   return;
  // }

  try {
    // Check if the user has already liked the post
    const searchLike = `SELECT * FROM likes WHERE user_id = '${user_id}' AND post_id = '${post_id}';`;
    const likeResult = await db.send_sql(searchLike);
    if (likeResult.length > 0) {
      res.status(409).json({ error: "Post already liked." });
      return;
    }

    const insertQuery = `INSERT INTO likes (post_id, user_id) VALUES ('${post_id}', '${user_id}');`;
    const ans = await db.send_sql(insertQuery);
    if (ans.length == 0) {
      res.status(500).json({ error: "Error querying database." });
      return;
    } else {
      res.status(201).json({ message: "Post liked!" });
      return;
    }
  } catch (err) {
    res.status(500).json({ error: "Error querying database." + err });
    return;
  }
};

var unlikePost = async function (req, res) {
  const username = req.params.username;
  const user_id = await get_user_id(username);
  const post_id = req.body.post_id;

  // if (helper.isLoggedIn(req, username) == false) {
  //   res.status(403).json({ error: "Not logged in." });
  //   return;
  // }

  try {
    // Check if the user has already liked the post
    const searchLike = `SELECT * FROM likes WHERE user_id = '${user_id}' AND post_id = '${post_id}';`;
    const likeResult = await db.send_sql(searchLike);
    if (likeResult.length === 0) {
      res.status(404).json({ error: "Post not liked yet." });
      return;
    }

    // Delete the like from the database
    const deleteQuery = `DELETE FROM likes WHERE post_id = '${post_id}' AND user_id = '${user_id}';`;
    const deleteResult = await db.send_sql(deleteQuery);
    if (deleteResult.affectedRows === 0) {
      res.status(500).json({ error: "Error querying database." });
      return;
    } else {
      res.status(200).json({ message: "Post unliked successfully!" });
      return;
    }
  } catch (err) {
    res.status(500).json({ error: "Error querying database. " + err });
    return;
  }
};

var getLikes = async function (req, res) {
  const post_id = req.params.post_id;
  try {
    const insertQuery = `SELECT COUNT (*) AS num_likes FROM likes WHERE post_id = ${post_id}`;
    const ans = await db.send_sql(insertQuery);
    if (ans.length == 0) {
      res.status(500).json({ error: "Error querying database." });
    } else {
      res.status(201).json(ans[0].num_likes);
      return;
    }
  } catch (err) {
    res.status(500).json({ error: "Error querying database." + err });
    return;
  }
};

var getLikesTwitter = async function (req, res) {
  const post_id = req.params.post_id;
  try {
    const insertQuery = `SELECT likes FROM tweets WHERE post_id = ${post_id}`;
    const ans = await db.send_sql(insertQuery);
    if (ans.length == 0) {
      res.status(500).json({ error: "Error querying database." });
    } else {
      res.status(201).json(ans[0].likes);
      return;
    }
  } catch (err) {
    res.status(500).json({ error: "Error querying database." + err });
    return;
  }
};

var getLikedByUser = async function (req, res) {
  const post_id = req.params.post_id;
  const username = req.params.username;

  try {
    const likedByUserQuery = `SELECT * FROM likes l LEFT JOIN users u ON l.user_id = u.user_id WHERE l.post_id = ${post_id} AND u.username = '${username}';`;
    const ans = await db.send_sql(likedByUserQuery);
    if (ans.length == 0) {
      res.status(200).json(false);
      return;
    } else {
      res.status(201).json(true);
      return;
    }
  } catch (err) {
    res.status(500).json({ error: "Error querying database.", err });
  }
};

var getComments = async function (req, res) {
  const post_id = req.params.post_id;
  try {
    const insertQuery = `SELECT c.*, u.username, u.selfie FROM comments c LEFT JOIN users u ON u.user_id = c.author_id WHERE c.parent_post = ${post_id}`;
    const ans = await db.send_sql(insertQuery);
    if (ans.length == 0) {
      res.status(200).json([]);
      return;
    } else {
      res.status(200).json(ans);
      return;
    }
  } catch (err) {
    res.status(500).json({ error: "Error querying database." + err });
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

  const insert = `INSERT INTO comments (parent_post, caption, author_id) VALUES (${post_id}, '${caption}', ${req.session.user_id});`;

  const result = await db.insert_items(insert);

  if (result > 0) {
    res.status(201).json({ message: "Comment added!" });
    return;
  } else {
    console.log(err);
    res.status(500).json({ error: "Error adding comment." });
    return;
  }
};

var get_hashtags = async function (req, res) {
  const post_id = req.params.post_id;

  // get user_id of user with username username
  const search = `SELECT hashtag FROM post_hashtags WHERE post_id = ${post_id};`;
  const answer = await db.send_sql(search);
  if (answer.length == 0) {
    res.status(200).json([]);
    return;
  } else {
    res.status(200).json(answer);
    return;
  }
};

var get_top_hashtags = async function (req, res) {
  const query = `SELECT hashtag, COUNT(*) AS occurrence
  FROM hashtags
  GROUP BY hashtag
  ORDER BY occurrence DESC
  LIMIT 10;`;
  const answer = await db.send_sql(search);
  if (answer.length == 0) {
    res.status(200).json([]);
    return;
  } else {
    res.status(200).json(answer);
    return;
  }
};

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
  upload_profile_photo: uploadProfilePhoto,
  get_profile_photo: getProfilePhoto,
  get_feed: getFeed,
  create_post: createPost,
  like_post: likePost,
  unlike_post: unlikePost,
  get_likes: getLikes,
  get_likes_twitter: getLikesTwitter,
  get_liked_by_user: getLikedByUser,
  create_comment: create_comment,
  get_comments: getComments,
  get_hashtags: get_hashtags,
  get_top_hashtags: get_top_hashtags,
};

module.exports = routes;