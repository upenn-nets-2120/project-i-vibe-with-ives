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
let tweets = [];

// Connect to Kafka
const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  // Handling incoming messages
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        value: message.value.toString(),
      });
      const tweet = JSON.parse(message.value.toString());
      tweets.push(tweet);
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
  schedule.scheduleJob('*/0.5 * * * *', async function () {
    try {
      console.log("trying this again")
      await send_sql('DELETE FROM twitter'); // Clear the table
      const placeholders = tweets.map(() => `(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).join(',');
      const values = tweets.flatMap(tweet => [
        tweet.id, tweet.author_id, tweet.created_at, tweet.text, tweet.hashtags.join(','),
        tweet.mentions.join(','), tweet.urls, tweet.quotes, tweet.replies,
        tweet.retweets, tweet.likes, tweet.replied_to_tweet_id,
        tweet.quoted_tweet_id, tweet.retweet_id
      ]);

      if (values.length > 0) {
        await send_sql(`INSERT INTO twitter (id, author_id, created_at, text, hashtags, mentions, urls, quotes, replies, retweets, likes, replied_to_tweet_id, quoted_tweet_id, retweet_id) VALUES ${placeholders}`, values);
      }

      tweets = []; // Reset the tweet list
    } catch (err) {
      console.error(err);
    }
  });
}

run().catch(e => console.error(`[example/consumer] ${e.message}`, e));

process.on('SIGINT', async () => {
  console.log('Stopping consumer...');
  await consumer.disconnect();
  process.exit();
});
