const db = require("../models/db_access.js");
const helper = require("../routes/route_helper.js");

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

var get_friend_requests = async function (req, res) {
    const username = req.params.username; // Assuming username is passed as a query parameter
    console.log("friend_requests: " + username);
    // if (!helper.isLoggedIn(req, username)) {
    //     res.status(403).json({ error: "Not logged in." });
    //     return;
    // }

    // First, get the user_id of the logged-in user
    const search = `SELECT user_id FROM users WHERE username = '${username}';`;
    const user_result = await db.send_sql(search);

    if (user_result.length == 0) {
        res.status(404).json({ error: "User not found." });
        return;
    }

    const user_id = user_result[0].user_id;

    // Query to fetch friend requests
    const request_query = `
        SELECT u1.username AS requester_username, u2.username AS requestee_username
        FROM friend_requests fr
        JOIN users u1 ON fr.requester = u1.user_id
        JOIN users u2 ON fr.requestee = u2.user_id
        WHERE fr.requestee = '${user_id}';
    `;

    const requests = await db.send_sql(request_query);

    if (requests.length == 0) {
        res.status(204).send(); // No content found
    } else {
        console.log(requests);
        res.status(200).json(requests);
    }
};


var get_chat_requests = async function (req, res) {
    const username = req.params.username; // Assuming username is passed as a query parameter
    console.log("chat_requests: " + username);
    if (!helper.isLoggedIn(req, username)) {
        res.status(403).json({ error: "Not logged in." });
        return;
    }

    // First, get the user_id of the logged-in user
    const search = `SELECT user_id FROM users WHERE username = '${username}';`;
    const user_result = await db.send_sql(search);

    if (user_result.length == 0) {
        res.status(404).json({ error: "User not found." });
        return;
    }

    const user_id = user_result[0].user_id;

    // Query to fetch chat requests
    const request_query = `
        SELECT u.username AS username, g.group_name AS group_name
        FROM invites i
        JOIN users u ON i.user_id = u.user_id
        JOIN \`groups\` g ON i.group_id = g.group_id
        WHERE i.user_id = '${user_id}';
    `;

    const requests = await db.send_sql(request_query);

    if (requests.length == 0) {
        res.status(204).send(); // No content found
    } else {
        console.log(requests);
        res.status(200).json(requests);
    }
};

var post_reject_chat = async function (req, res) {
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


    const search2 = `SELECT group_id FROM \`groups\` WHERE  group_name = '${chat_name}';`;
    const result2 = await db.send_sql(search2);

    if (result2.length == 0) {
        res.status(500).json({ error: "Error querying database." });
        return;
    }
    const group_id = result2[0].user_id;

    const delete_query = `DELETE FROM invites WHERE group_id = '${group_id}' AND user_id = '${user_id}';`;
    const result3 = await db.insert_items(delete_query);

    if (result3 > 0) {
        res.status(201).json({ message: "Invite removed." });
        return;
    }

    return res.status(500).json({ error: "Error querying database." });
};

var routes = {
    get_friend_requests: get_friend_requests,
    get_chat_requests: get_chat_requests,
    post_reject_chat: post_reject_chat,
}

module.exports = routes;