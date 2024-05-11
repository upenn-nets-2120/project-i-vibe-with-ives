///////////////
// NETS 2120 Sample Kafka Client
///////////////

const express = require('express');
const { Kafka } = require('kafkajs');

var config = require('./config.json');

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
            { value: 'pushing to federated posts' },
        ],
    })

    await producer.disconnect()
}

runProducer().catch(console.error);
