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
const math = require('mathjs');

const db = dbsingleton;


function cosineSimilarity(vecA, vecB) {
  const dotProduct = math.dot(vecA, vecB);
  const normA = math.norm(vecA);
  const normB = math.norm(vecB);
  return dotProduct / (normA * normB);
}

async function fetchAndEmbedPosts(embeddings) {
  const sqlQuery = `SELECT * FROM posts`;
  const result = await db.send_sql(sqlQuery);
  return await Promise.all(result.map(async (item) => ({
    document: item,
    embedding: await embeddings.embedQuery(item.caption)
  })));
}

async function fetchAndEmbedPeople(embeddings) {
  const sqlQuery = `SELECT * FROM users`;
  const result = await db.send_sql(sqlQuery);
  return await Promise.all(result.map(async (item) => ({
    document: item,
    embedding: await embeddings.embedQuery(item.username)
  })));
}
  
var get_similar_posts = async function (req, res) {
  const query = req.query.question;
  if (!query) {
    res.status(200);
    return;
  }
  const type = 'posts';
  const similar = await get_similar(query, type);
  res.status(200).json({ answer: similar });
}

var get_similar_people = async function (req, res) {
  const query = req.query.question;
  if (!query) {
    res.status(200);
    return;
  }
  const type = 'people';
  const similar = await get_similar(query, type);
  res.status(200).json({ answer: similar });
}

var get_similar = async function (query, type) {  
  const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    batchSize: 512,
    model: "text-embedding-3-small"
  });

  const documents = type === 'posts' ? await fetchAndEmbedPosts(embeddings) : await fetchAndEmbedPeople(embeddings);
  const queryEmbedding = await embeddings.embedQuery(query);
  
  documents.sort((a, b) => cosineSimilarity(queryEmbedding, b.embedding) - cosineSimilarity(queryEmbedding, a.embedding));

  const topDocuments = documents.slice(0, 5).map(doc => doc.document);
  return topDocuments;

}

var ask_question = async function (req, res) {
  const question = req.query.question;
  if (!question) {
    res.status(200);
    return;
  }

  const posts = await get_similar(question, 'posts');
  const context = posts.map(post => post.caption).join('\n');

  const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-3.5-turbo-0301"
  });

  const promptTemplate = PromptTemplate.fromTemplate(
    "Answer the question: {question} \n\n Here is some context scraped from posts: {context} \n\n"
  );
  const chain = RunnableSequence.from([promptTemplate, llm]);
  

  const result = await chain.invoke({ question: question, context: context});

  res.status(200).json({ answer: result.content });
}

var search_routes = {
    ask_question: ask_question,
    get_similar_posts: get_similar_posts,
    get_similar_people: get_similar_people
};  

module.exports = search_routes;