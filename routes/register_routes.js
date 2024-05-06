const routes = require("./routes.js");
const rec_routes = require("./friend_routes.js");
const profile_routes = require("./profile_routes.js")

module.exports = {
  register_routes,
};
// https://docs.google.com/document/d/1JgVi5vEvT5Pohz-mpo9U3bhsrNRideIpvq0p8zMU8os/edit
function register_routes(app) {
  app.get("/hello", routes.get_helloworld);
  app.post("/login", routes.post_login);
  app.get("/logout", routes.post_logout);
  app.post("/register", routes.post_register);
  app.get("/:username/friends", routes.get_friends);
  // app.get("/:username/recommendations", routes.get_friend_recs);
  app.post("/:username/createPost", routes.create_post);
  app.get("/:username/feed", routes.get_feed);
  // TODO: register getMovie, which does not need a :username
  //       Make it compatible with the call from ChatInterface.tsx
  app.post("/:username/movies", routes.get_movie);
  app.get("/:username/recommendations", rec_routes.get_recs);

  // chat routes
  app.get("/:username/chats", routes.get_chats);
  app.get("/:username/messages", routes.get_messages);
  app.post("/:username/sendMessage", routes.post_send_message);
  app.post("/createChat", routes.post_create_chat);
  app.post("/:username/leaveChat", routes.post_leave_chat);
  app.post("/:username/inviteMember", routes.post_invite_member);
  app.post("/:username/joinChat", routes.post_join_chat);

  // random setters
  app.post("/:username/addHashtag", routes.post_add_hashtag);
  app.post("/:username/removeHashtag", routes.post_remove_hashtag);
  app.post("/:username/setEmail", routes.post_set_email);
  app.post("/:username/setPassword", routes.post_set_password);
  app.get("/:username/getProfile", routes.get_profile);
  // app.get("/getPosts", profile.get_posts);

  // friends requests
  app.post("/:username/requestFriend", routes.post_request_friend);
  app.post("/:username/acceptFriend", routes.post_accept_friend);
  app.post("/:username/removeFriend", routes.post_remove_friend);

  // todo:
  app.get("/:username/getPosts", profile_routes.get_user_posts);
  app.post("/:username/:post_id/sendLike", profile_routes.send_like);
  app.post("/:username/createComment", profile_routes.create_comment);
  app.get("/:post_id/getComments", profile_routes.get_comments);
  app.get("/:post_id/getPostById", profile_routes.get_id_post);
  app.get("/:loggedIn/hasRequested/:username", profile_routes.are_friends_req);
  app.get("/:loggedIn/isFriendsWith/:username", profile_routes.are_friends);
  app.get("/:post_id/getHashtags", profile_routes.get_hashtags);

}
