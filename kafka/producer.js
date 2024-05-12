///////////////
// NETS 2120 Sample Kafka Client
///////////////

const express = require('express');
const { Kafka } = require('kafkajs');

var config = require('./kafka_config.json');

const app = express();
const kafka = new Kafka({
    clientId: 'my-app',
    brokers: config.bootstrapServers
});

const producer = kafka.producer()

const runProducer = async () => {
    await producer.connect()
    await producer.send({
        topic: "FederatedPosts",
        messages: [
            { post_json: 
                post_json = JSON.stringify( {
                    "username":"pwu",
                    "source_sit":"g22",
                    "post_uuid_within_site":"2",
                    "post_text":"red roses for me!",
                    "content_type":"text/html"
                })
             },
        ],
    })

    await producer.disconnect()
}

runProducer().catch(console.error);
