const routes = require("./routes.js");
const routes2 = require("./search_routes.js");

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
  app.get("/:username/recommendations", routes.get_friend_recs);
  app.post("/:username/createPost", routes.create_post);
  app.get("/:username/feed", routes.get_feed);
  // TODO: register getMovie, which does not need a :username
  //       Make it compatible with the call from ChatInterface.tsx

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

  // search routes
  app.get("/:username/searchPosts", routes2.get_similar_posts);
  app.get("/:username/searchPeople", routes2.get_similar_people);
  app.get("/:username/askQuestion", routes2.ask_question);

}
