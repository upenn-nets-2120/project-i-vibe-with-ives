// /:username/recommendations
var getRecommendations = async function (req, res) {
  // TODO: check username and password and login
  const username = req.params.username;

  // check if user is logged in
  if (helper.isLoggedIn(req, username) == false) {
    res.status(403).json({ error: "Not logged in." });
    return;
  }

  // social ranks per user (user1_id, socialrank)
  // mutual friends per user (i.e. recommendations) (user1_id, recommendation)
  // join socialrank and recommendations table on user1_id, sort by social rank, get highest 10 per usualy
  const query = `SELECT users.user_id, users.username FROM recommendations r JOIN socialranks s ON r.recommendation = s.user1_id JOIN users ON r.user1_id = users.user_id WHERE r.user1_id = ${req.session.user_id} ORDER BY s.socialrank DESC LIMIT 10;`;
  try {
    const result = await db.send_sql(searchQuery);
    const formattedData = {
      results: result.map((item) => ({
        recommendation: item.user_id,
        username: item.username,
      })),
    };
    res.status(200).json(formattedData);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error querying database." });
    return;
  }
};

// var createFollowedMap = async function () {
//   let friendMap = {};
//   const searchQuery = `SELECT DISTINCT user1_id, user2_id FROM friends;`;
//   try {
//     const results = await db.send_sql(searchQuery);
//     results.forEach(({ user1, user2 }) => {
//       // TODO: confirm that we are adding TWO entries for each friendship
//       // Add user1 to user2's list of friends
//       if (!friendMap.has(user1)) {
//         friendMap.set(user1, []);
//       }

//       if (!friendMap.get(user1).includes(user2)) {
//         friendMap.get(user1).push(user2);
//       }
//     });

//     return friendMap;
//   } catch (err) {
//     console.log(err);
//     return;
//   }
// };

// var computeRecommendations = async function (req, res) {
//   const friendMap = await createFollowedMap();
//   if (!friendMap) {
//     res.status(500).json({ error: "Error computing friendMap." });
//     return;
//   }

//   let recommendations = new Map(); //Map<String, Map<String, Integer>>

//   // compute friend of a friend recommendations, storing them in recommendations table with (user, recommendation, strength
//   for (const user in friendMap) {
//     for (const friend of friendMap.get(user)) {
//       if (friendMap.has(friend)) {
//         for (const friendOfFriend of friendMap.get(friend)) {
//           if (
//             friendOfFriend != user &&
//             !friendMap[user].includes(friendOfFriend)
//           ) {
//             if (!recommendations.has(user)) {
//               recommendations.set(user, new Map());
//             }

//             // add friend of friend to recommendations
//             if (!recommendations.get(user).has(friendOfFriend)) {
//               recommendations.get(user).set(friendOfFriend, 1);
//             } else {
//               recommendations
//                 .get(user)
//                 .set(
//                   friendOfFriend,
//                   recommendations.get(user).get(friendOfFriend) + 1
//                 );
//             }
//           }
//         }
//       }
//     }
//   }

//   // insert recommendations into database
//   for (const user in recommendations) {
//     for (const recommendation in recommendations.get(user)) {
//       const insertQuery = `INSERT INTO recommendations (user_id, recommendation, strength) VALUES (${user}, ${recommendation}, ${recommendations
//         .get(user)
//         .get(recommendation)});`;
//       try {
//         await db.send_sql(insertQuery);
//       } catch (err) {
//         console.log(err);
//         res.status(500).json({ error: "Error inserting recommendations." });
//         return;
//       }
//     }
//   }
// };
