const routes = require("./routes.js");
const rec_routes = require("./friend_routes.js");
const actorRoutes = require("./actorRoutes.js");
const feed_routes = require("./feed_routes.js");


module.exports = {
  register_routes,
};
// https://docs.google.com/document/d/1JgVi5vEvT5Pohz-mpo9U3bhsrNRideIpvq0p8zMU8os/edit
function register_routes(app) {
  app.get("/hello", routes.get_helloworld);
  app.post("/login", routes.post_login);
  app.get("/logout", routes.post_logout);

  // pw
  app.post("/register", actorRoutes.post_register);
  app.get("/actors", actorRoutes.get_actors);
  // app.post("/:username/setActor", routes.post_set_actor);


  app.get("/:username/friends", routes.get_friends);
  // app.get("/:username/recommendations", routes.get_friend_recs);
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
  app.get("/getProfile", routes.get_profile);

  // friends requests
  app.post("/:username/requestFriend", routes.post_request_friend);
  app.post("/:username/acceptFriend", routes.post_accept_friend);
  app.post("/:username/removeFriend", routes.post_remove_friend);

  // feed stuff:
  app.post("/:username/createPost", feed_routes.create_post);
  app.get("/:username/feed", feed_routes.get_feed);
  app.post("/:username/uploadProfilePhoto", feed_routes.upload_profile_photo);
  app.get("/:username/profilePhoto", feed_routes.get_profile_photo);
  app.post("/:username/likePost", feed_routes.like_post);
  app.get("/:post_id/getLikes", feed_routes.get_likes);
  app.get("/:post_id/getLikedByUser", feed_routes.get_liked_by_user);



}
