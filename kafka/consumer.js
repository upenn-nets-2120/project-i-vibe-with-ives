const { Kafka } = require('kafkajs');
const schedule = require('node-schedule');
const db = require("../models/db_access.js");
const { CompressionTypes, CompressionCodecs } = require('kafkajs');
const SnappyCodec = require('kafkajs-snappy');
const config = require("./kafka_config.json"); // Load configuration
 
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec


// Kafka configuration
const kafka = new Kafka({
    clientId: 'my-app',
    brokers: config.bootstrapServers
});

const consumer = kafka.consumer({ 
    groupId: config.groupId, 
    bootstrapServers: config.bootstrapServers
});

let topic = config.topic;
// let tweets = [];
let tweets = [
  {
    quoted_tweet_id: null,
    hashtags: [],
    created_at: 1715196242000,
    replied_to_tweet_id: null,
    quotes: 2,
    urls: 'https://ew.com/perfect-match-season-2-cast-harry-jowsey-dom-gabriel-8645395?taid=663bd152e2ae8c0001407232&utm_campaign=entertainmentweekly_entertainmentweekly&utm_content=new&utm_medium=social&utm_source=twitter.com',
    replies: 0,
    conversation_id: 1788288772704006100,
    mentions: [],
    id: 1788288772704006100,
    text: "Meet the 'Perfect Match' season 2 cast, including stars from 'Too Hot to Handle,' 'The Circle,' 'Love is Blind,' and more. https://t.co/9yfEuoml0m",
    author_id: 16312576,
    retweets: 2,
    retweet_id: null,
    likes: 12
  },
  {
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
  },
  {
    quoted_tweet_id: null,
    hashtags: [],
    created_at: 1715193904000,
    replied_to_tweet_id: null,
    quotes: 1,
    urls: 'https://ew.com/alexander-skarsgard-harry-potter-actor-harry-melling-queer-biker-gang-movie-8645298?taid=663bc830216b8d0001848f86&utm_campaign=entertainmentweekly_entertainmentweekly&utm_content=new&utm_medium=social&utm_source=twitter.com',
    replies: 2,
    conversation_id: 1788278965536166000,
    mentions: [],
    id: 1788278965536166000,
    text: "Alexander Skarsgård will take 'all sorts of virginities' from 'Harry Potter' star Harry Melling in an upcoming 'kinky' queer biker movie. https://t.co/pPqGzHjBDU",
    author_id: 16312576,
    retweets: 8,
    retweet_id: null,
    likes: 53
  },
  {"quoted_tweet_id":null,
  "hashtags":["TBT"],
  "created_at":1712847606000,
  "replied_to_tweet_id":null,
  "quotes":0,
  "urls":"https://imdb.to/3xwOGF2",
  "replies":32,
  "conversation_id":1778437876872581271,
  "mentions":[],
  "id":1778437876872581271,
  "text":"Still plenty of time for a 🌸 spring fling 🌸, just saying. #TBT https://t.co/gaXU3uJb8V https://t.co/lIvzJnlQBh",
  "author_id":17602896,
  "retweets":80,
  "retweet_id":null,
  "likes":174}
];

function escapeSQLString(value) {
  if (value === null) return 'NULL';
  return `'${value.replace(/'/g, "''")}'`; // Escape single quotes by doubling them
}

async function addToTable() {
  try {
    console.log("adding to table...")
    // console.log(tweets)
    // await db.send_sql('DELETE FROM tweet_hashtags'); // Clear the table
    // await db.send_sql('DELETE FROM tweets'); // Clear the table

    tweets.map(async tweet => {
      const { id, quoted_tweet_id, created_at, replied_to_tweet_id, quotes, urls, replies,
        conversation_id, text, author_id, retweets, retweet_id, likes } = tweet;

        const sql = `INSERT INTO tweets (id, quoted_tweet_id, created_at, replied_to_tweet_id, quotes, urls, replies, conversation_id, text, author_id, retweets, retweet_id, likes, hashtags, mentions) VALUES (${id || 'NULL'}, ${quoted_tweet_id || 'NULL'}, ${created_at || 'NULL'}, ${replied_to_tweet_id || 'NULL'}, ${quotes || 0}, ${escapeSQLString(urls)}, ${replies || 0}, ${conversation_id || 'NULL'}, ${escapeSQLString(text)}, ${author_id || 'NULL'}, ${retweets || 0}, ${retweet_id || 'NULL'}, ${likes || 0}, ${escapeSQLString(tweet.hashtags.join(','))}, ${escapeSQLString(tweet.mentions.join(','))})`;

        try {

          const response = await db.send_sql(sql);
          let insertHash;
          let hashResponse;
          // for each hashtag in tweet.hashtags, add it to the tweet_hashtag table
          console.log(tweet.hashtags)
          tweet.hashtags.map(async hashtag => {
            insertHash = `INSERT INTO tweet_hashtags (id, hashtag) VALUES (${id}, "${hashtag}");`;
            hashResponse = await db.send_sql(insertHash);
            console.log("added hash!")

          });

        } catch (err) {
          console.log("Error adding to table")
        }
        

        //create table

        

    })
    
    console.log("added to table!");
    tweets = []; // Reset the tweet list
    
  } catch (err) {
    console.error(err);
  }
}

// Connect to Kafka
const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  // await db.send_sql('DELETE FROM tweet_hashtags'); // Clear the table
  // await db.send_sql('DELETE FROM tweets'); // Clear the table


  // Handling incoming messages
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        value: message.value.toString(),
      });
      try {
        const tweet = JSON.parse(message.value.toString());
        tweets.push(tweet);
      } catch (error) {
        console.log("Error parsing tweet")
      }
      
      addToTable();
    },
  });

  /*
  
  {"quoted_tweet_id":null,
    "hashtags":["TBT”],
    "created_at":1712847606000,
    "replied_to_tweet_id":null,
    "quotes":0,
    "urls":"https://imdb.to/3xwOGF2”,
    "replies":32,
    "conversation_id":1778437876872581271,
    "mentions":[],
    "id":1778437876872581271,
    "text":"Still plenty of time for a 🌸 spring fling 🌸, just saying. #TBT https://t.co/gaXU3uJb8V https://t.co/lIvzJnlQBh”,
    "author_id":17602896,
    "retweets":80,
    "retweet_id":null,
    "likes":174}
  
  */

  // Schedule to clear and insert data every hour
  // schedule.scheduleJob('*/0.5 * * * *', async function () 

  // run addToTable every 10 seconds
  // setInterval(addToTable, 10000);
  // addToTable();

}


run().catch(e => console.error(`[example/consumer] ${e.message}`, e));
// addToTable();

process.on('SIGINT', async () => {
  console.log('Stopping consumer...');
  await consumer.disconnect();
  process.exit();
});
