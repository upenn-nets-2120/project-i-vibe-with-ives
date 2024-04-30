const routes = require("./routes.js");
const actorRoutes = require("./actorRoutes.js");

module.exports = {
  register_routes,
};

function register_routes(app) {
  app.get("/hello", routes.get_helloworld);
  app.post("/login", routes.post_login);
  app.get("/logout", routes.post_logout);

  // pw
  app.post("/register", actorRoutes.post_register);
  app.get("/actors", actorRoutes.get_actors);
  // app.post("/:username/setActor", routes.post_set_actor);


  app.get("/:username/friends", routes.get_friends);
  app.get("/:username/recommendations", routes.get_friend_recs);
  app.post("/:username/createPost", routes.create_post);
  app.get("/:username/feed", routes.get_feed);
  // TODO: register getMovie, which does not need a :username
  //       Make it compatible with the call from ChatInterface.tsx
  app.post("/:username/movies", routes.get_movie);
}
