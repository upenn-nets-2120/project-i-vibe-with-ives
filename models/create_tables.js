const dbaccess = require("./db_access");
const config = require("../config.json"); // Load configuration

async function create_tables(db) {
  // TODO: define the names table (or use previous one)?.
  // var qa = db.create_tables('...');

  var names = db.create_tables(
    "CREATE TABLE IF NOT EXISTS names ( \
      nconst VARCHAR(255) NOT NULL PRIMARY KEY, \
      primaryName VARCHAR(255), \
      birthYear INT, \
      deathYear INT \
    );"
  );

  var q1 = db.create_tables(
    "CREATE TABLE IF NOT EXISTS users ( \
      user_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, \
      username VARCHAR(255), \
      hashed_password VARCHAR(255), \
      first_name VARCHAR(255), \
      last_name VARCHAR(255), \
      affiliation VARCHAR(255), \
      linked_nconst VARCHAR(10), \
      birthday DATE, \
      email VARCHAR(255), \
      selfie VARCHAR(255), \
      FOREIGN KEY (linked_nconst) REFERENCES names(nconst) \
      );"
  );

  var q2 = db.create_tables(
    "CREATE TABLE IF NOT EXISTS posts ( \
      post_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, \
      parent_post INT, \
      title VARCHAR(255), \
      content VARCHAR(255), \
      author_id INT, \
      depth INT, \
      image VARCHAR(255), \
      FOREIGN KEY (parent_post) REFERENCES posts(post_id), \
      FOREIGN KEY (author_id) REFERENCES users(user_id) \
      );"
  );

  var q3 = db.create_tables("CREATE TABLE IF NOT EXISTS likes ( \
    post_id INT, \
    user_id INT, \
    FOREIGN KEY (post_id) REFERENCES posts(post_id), \
    FOREIGN KEY (user_id) REFERENCES users(user_id) \
    );"
  );

  // CREATE TABLE IF NOT EXISTS tweet_hashtags (id bigint, hashtag VARCHAR(255), FOREIGN KEY (id) REFERENCES tweets(id));

  var q4 = db.create_tables('CREATE TABLE IF NOT EXISTS user_hashtags ( \
      user_id INT, \
      hashtag VARCHAR(255), \
      FOREIGN KEY (user_id) REFERENCES users(user_id) \
      );');

  var q5 = db.create_tables('CREATE TABLE IF NOT EXISTS post_hashtags ( \
    post_id INT, \
    hashtag VARCHAR(255), \
    FOREIGN KEY (post_id) REFERENCES posts(post_id) \
    );');

  var q6 = db.create_tables(
    "CREATE TABLE IF NOT EXISTS friends ( \
    followed INT, \
    follower INT, \
    FOREIGN KEY (follower) REFERENCES users(user_id), \
    FOREIGN KEY (followed) REFERENCES users(user_id) \
);"
  );

  var q7 = db.create_tables(
    "CREATE TABLE IF NOT EXISTS `groups` ( \
    group_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, \
    group_name VARCHAR(255) \
    );"
  );

  var q8 = db.create_tables(
    "CREATE TABLE IF NOT EXISTS messages ( \
    group_id INT, \
    sender_id INT, \
    timestamp DATE, \
    message VARCHAR(255), \
    FOREIGN KEY (group_id) REFERENCES `groups`(group_id), \
    FOREIGN KEY (sender_id) REFERENCES users(user_id) \
    );"
  );

  var q9 = db.create_tables(
    "CREATE TABLE IF NOT EXISTS group_members ( \
    group_id INT, \
    user_id INT, \
    FOREIGN KEY (group_id) REFERENCES `groups`(group_id), \
    FOREIGN KEY (user_id) REFERENCES users(user_id) \
    );"
  );

  var q10 = db.create_tables(
    'CREATE TABLE IF NOT EXISTS recommendations ( \
    user_id INT, \
    recommendation INT, \
    strength INT, \
    FOREIGN KEY (user_id) REFERENCES users(user_id), \
    FOREIGN KEY (recommendation) REFERENCES users(user_id) \
  );'
  );

  var q11 = db.create_tables(
    "CREATE TABLE IF NOT EXISTS invites ( \
    invite_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, \
    group_id INT, \
    user_id INT, \
    FOREIGN KEY (user_id) REFERENCES users(user_id), \
    FOREIGN KEY (group_id) REFERENCES `groups`(group_id) \
    );"
  );

  return await Promise.all([q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11]);
}

// Database connection setup
const db = dbaccess.get_db_connection();

var result = create_tables(dbaccess).then(() => { console.log('Tables created'); dbaccess.close_db(); });


const PORT = config.serverPort;