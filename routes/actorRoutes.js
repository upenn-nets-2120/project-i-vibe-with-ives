const dbsingleton = require("../models/db_access.js");
const fs = require('fs');
var path = require('path');
const { ChromaClient } = require("chromadb");
const config = require("../config.json"); // Load configuration
const bcrypt = require("bcrypt");
const helper = require("../routes/route_helper.js");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Face Matching imports from app.js
const { initializeFaceModels, findTopKMatches, indexAllFaces, getEmbeddings, client } = require('../basic-face-match/app');
const { get } = require("http");

initializeFaceModels().catch(console.error);


// Database connection setup
const db = dbsingleton;
// POST /register
var postRegister = async function (req, res) {
    // register a user with given body parameters
    const username = req.body.username;
    const password = req.body.password;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const affiliation = req.body.affiliation;
    const birthday = req.body.birthday;
    const selfie = req.body.selfie;
    const email = req.body.email;
    const linked_nconst = req.body.linked_nconst;
    const img = req.body.img;
    // add stuff to store image to s3 bucket and get link


    // const linked_nconst = req.body.linked_nconst;

    console.log(username);
    console.log(password);
    // console.log(linked_nconst);

    // throw 400 error if any of username, password, email, lnked_nconst is empty
    if (!username || !password || !email) {
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
            // if user with same username already exists in database, throw 409 error
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
                    const insert = `INSERT INTO users (username, hashed_password, first_name, last_name, affiliation, linked_nconst, birthday, email, selfie) VALUES ('${username}', '${hash}', '${firstName}', '${lastName}', '${affiliation}', "nm0000122", '${birthday}', '${email}', '${selfie}');`;
                    // try catch and await call
                    const result = await db.insert_items(insert);
                    if (result > 0) {
                        req.session.user_id = await get_user_id(username);
                        req.session.username = username;
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

var getActors = async function (req, res) {
    console.log("getActors");

    // Now you will access the file from req.file, as it is parsed by multer
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const img = req.file.path; // Using the path where multer saved the file
    try {
        const collection = await client.getOrCreateCollection({
            name: "face-api",
            embeddingFunction: null,
            metadata: { "hnsw:space": "l2" }
        });

        console.info("Looking for files");
        const promises = [];
        // Loop through all the files in the images directory
        fs.readdir("/nets2120/nets-project/basic-face-match/images", function (err, files) {
            if (err) {
                console.error("Could not list the directory.", err);
                process.exit(1);
            }

            files.forEach(function (file, index) {
                promises.push(indexAllFaces(path.join("/nets2120/nets-project/basic-face-match/images", file), file, collection));
            });

            Promise.all(promises)
                .then(async (results) => {
                    console.info("All images indexed.");

                    const matches = await findTopKMatches(collection, img, 5);
                    const processedMatches = matches.map(match => {
                        return match.ids[0].map(id => {
                            const linked_nconst = id.split(".")[0]; // This assumes the id format is like "nm0002001.jpg-1"
                            return {
                                linked_nconst,
                                img: id.split("-")[0] // Assuming the full path needs the original filename
                            };
                        });
                    });
                    console.log(processedMatches[0])
                    res.status(200).json({ actors: processedMatches[0] });
                    return;
                })
                .catch((err) => {
                    console.error("Error indexing images:", err);
                    res.status(500).send('Error indexing images.');
                    return;
                });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing image.');
        return;
    }
};

var setActor = async function (req, res) {
    const username = req.params.username;
    const actor = req.body.actor;
    const insert = `UPDATE users SET linked_nconst = '${actor}' WHERE username = '${username}';`;
    try {
        const result = await db.insert_items(insert);
        if (result > 0) {
            res.status(200).json({ username: username, actor: actor });
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
    post_register: postRegister,
    get_actors: getActors,
    set_actor: setActor
};

module.exports = routes;