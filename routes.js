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
  const linked_nconst = req.body.linked_id;

  console.log(req)

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

// define a function for encrypting passwords
// Function for encrypting passwords WITH SALT
// Look at the bcrypt hashing routines
var callback = function (err, result) {
  if (err) {
    res.status(500).json({ error: "Error checking passwords." });
    return;
  } else if (result) {
    res.status(200).json({ username: username });
    req.session.user_id = result[0].user_id;
    return;
  } else {
    res.status(401).json({ error: "Username and/or password are invalid." });
    return;
  }
};

// POST /login
var postLogin = async function (req, res) {
  // TODO: check username and password and login
  const username = req.body.username;
  const password = req.body.password;

  // if (!username || !password) {
  //   res.status(400).json({
  //     error:
  //       "One or more of the fields you entered was empty, please try again.",
  //   });
  //   return;
  // }
  const search = `SELECT * FROM users WHERE username = "${username}";`;
  console.log(search);

  try {
    const result = await db.send_sql(search);
    if (result.length == 0) {
      res.status(401).json({error: "Username and/or password are invalid."});
      return;
    } else {
      const hash = result[0].hashed_password;
      const match =  await bcrypt.compare(password, hash) 
      console.log(password)
      console.log(hash)
      console.log(match)
      if (!match) {
        res.status(401).json({
          error: "Username and/or password are invalid.",
        });
        return;
      }
      req.session.user_id = result[0].user_id;
      req.session.username = result[0].username;
      return res.status(200).json({ username: username });
    
    }
  } catch (err) {
      res.status(500).json({ error: "Error querying database." });
      return;
  }
}
  

// GET /logout
var postLogout = function (req, res) {
  // set session user_id to null
  try {
    req.session.user_id = null;
    req.session.username = null;
  } catch (err) {
    console.log(err)
  }

  return;
  
};

// GET /friends
var getFriends = async function (req, res) {
  // TODO: get all friends of current user

  console.log(req.session);
  const username = req.params.username;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  const search = `SELECT names.nconst, names.primaryName FROM users JOIN friends ON users.linked_nconst = friends.follower JOIN names ON friends.followed = names.nconst WHERE users.username = '${username}';`;

  try {
    const result = await db.send_sql(search);
    const formattedData = {
      results: result.map((item) => ({
        followed: item.nconst,
        primaryName: item.primaryName,
      })),
    };
    res.status(200).json(formattedData);
  } catch (err) {
    res.status(500).json({ error: "Error querying database." });
    return;
  }
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

  if (!parent_id) {
    parent_id = "null"
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
    res.status(500).json({  error: "Error querying database." });
    return;
  } else {
    req.session.user_id = answer[0].user_id;
  }

  const insert = `INSERT INTO posts (title, content, author_id, parent_post) VALUES ('${title}', '${content}', '${req.session.user_id}', '${parent_id}');`;
  const result = await db.insert_items(insert)
  if (result > 0) {
      res.status(201).json({ message: "Post created." });
      return;
  } else {
      res.status(500).json({ error: "Error querying database." });
      return;
  
  }


}

// GET /feed
var getFeed = async function (req, res) {
  // TODO: get the correct posts to show on current user's feed
  // get all posts from users that the current user follows and their own posts
  const username = req.params.username;

  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  // get user_id of user with username username
  const initSearch = `SELECT user_id FROM users WHERE username = '${username}';`;
  try {
    const result = await db.send_sql(initSearch);
    if (result.length == 0) {
      res.status(500).json({ error: "Error querying database." });
      return;
    } else {
      req.session.user_id = result[0].user_id;
      req.session.linked_id = answer[0].linked_nconst;
    }
  } catch (err) {
    res.status(500).json({ error: "Error querying database." });
    return;
  }

  //get user id of all users that the current user follows and themselves
  const search = ` WITH feed_users AS (SELECT users.user_id, users.username FROM users JOIN friends ON users.linked_nconst = friends.followed WHERE friends.follower = '${req.session.linked_id}' UNION SELECT user_id, username FROM users WHERE user_id = '${req.session.user_id}') 
    SELECT f.username, posts.parent_post, posts.title, posts.content FROM feed_users f JOIN posts ON f.user_id = posts.author_id;`;

  try {
    const result = await db.send_sql(search)
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
    res.status(500).json({ error: "Error querying database." });
    return;
  }
  
}

var getMovie = async function (req, res) {
  const vs = await getVectorStore();
  const retriever = vs.asRetriever();

  const username = req.params.username;
  // req.session.username = username;

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
};

module.exports = routes;
