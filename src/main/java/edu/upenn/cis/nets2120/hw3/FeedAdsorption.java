package edu.upenn.cis.nets2120.hw3;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.apache.logging.log4j.LogManager;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;

import edu.upenn.cis.nets2120.config.Config;
import scala.Tuple2;

public class FeedAdsorption extends SparkJob<List<Tuple2<Tuple2<String, String>, Double>>> {
    static org.apache.logging.log4j.Logger logger = LogManager.getLogger(ComputeRanks.class);

    // Convergence condition variables
    protected double d_max; // largest change in a node's rank from iteration i to iteration i+1
    protected int i_max; // max number of iterations
    int max_answers = 1000;

    Connection connection;

    public FeedAdsorption(double d_max, int i_max, int answers, boolean debug) {
        super(true, true, debug);
        this.d_max = d_max;
        this.i_max = i_max;
        this.max_answers = answers;
    }

    public void getConnection() {
        try {
            logger.info("Connecting to database...");
            try {
                connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                        Config.DATABASE_PASSWORD);
            } catch (SQLException e) {
                logger.error("Connection to database failed: " + e.getMessage(), e);
                logger.error(
                        "Please make sure the RDS server is correct, the tunnel is enabled, and you have run the mysql command to create the database.");
                System.exit(1);
            }

            if (connection == null) {
                logger.error("Failed to make connection - Connection is null");
                System.exit(1);
            }

            logger.info("Successfully connected to database!");
        } catch (Exception e) {
            logger.error("SQL error occurred: " + e.getMessage(), e);
        }
    }

    protected JavaPairRDD<String, String> getFriends() {
        String query = "SELECT user1_id, user2_id FROM friends";

        try {
            Statement stmt = connection.createStatement();

            List<Tuple2<String, String>> edgesList = new ArrayList<>();

            ResultSet rs = stmt.executeQuery(query);

            while (rs.next()) {
                String user1_id = rs.getString("user1_id");
                String user2_id = rs.getString("user2_id");
                edgesList.add(new Tuple2<String, String>(user1_id, user2_id));
            }

            JavaRDD<Tuple2<String, String>> edges = context.parallelize(edgesList);

            return JavaPairRDD.fromJavaRDD(edges);
        } catch (SQLException e) {
            System.out.println("Query execution failed.");
            e.printStackTrace();
        }

        return null;
    }

    protected JavaPairRDD<String, String> getPostsUsers() {
        String query = "SELECT post_id, author_id FROM posts";

        try {
            Statement stmt = connection.createStatement();

            List<Tuple2<String, String>> edgesList = new ArrayList<>();

            ResultSet rs = stmt.executeQuery(query);

            while (rs.next()) {
                String post_id = rs.getString("post_id");
                String author_id = rs.getString("author_id");
                edgesList.add(new Tuple2<String, String>(post_id, author_id));
            }

            JavaRDD<Tuple2<String, String>> edges = context.parallelize(edgesList);

            return JavaPairRDD.fromJavaRDD(edges);
        } catch (SQLException e) {
            System.out.println("Query execution failed.");
            e.printStackTrace();
        }

        return null;
    }

    protected JavaPairRDD<String, String> getUsersHashtags() {
        String query = "SELECT user_id, hashtag FROM user_hashtags";

        try {
            Statement stmt = connection.createStatement();

            List<Tuple2<String, String>> edgesList = new ArrayList<>();

            ResultSet rs = stmt.executeQuery(query);

            while (rs.next()) {
                String user_id = rs.getString("user_id");
                String hashtag = rs.getString("hashtag");
                edgesList.add(new Tuple2<String, String>(user_id, hashtag));
            }

            JavaRDD<Tuple2<String, String>> edges = context.parallelize(edgesList);

            return JavaPairRDD.fromJavaRDD(edges);
        } catch (SQLException e) {
            System.out.println("Query execution failed.");
            e.printStackTrace();
        }

        return null;
    }

    protected JavaPairRDD<String, String> getPostsHashtags() {
        String query = "SELECT post_id, hashtag FROM post_hashtags";

        try {
            Statement stmt = connection.createStatement();

            List<Tuple2<String, String>> edgesList = new ArrayList<>();

            ResultSet rs = stmt.executeQuery(query);

            while (rs.next()) {
                String post_id = rs.getString("post_id");
                String hashtag = rs.getString("hashtag");
                edgesList.add(new Tuple2<String, String>(post_id, hashtag));
            }

            JavaRDD<Tuple2<String, String>> edges = context.parallelize(edgesList);

            return JavaPairRDD.fromJavaRDD(edges);
        } catch (SQLException e) {
            System.out.println("Query execution failed.");
            e.printStackTrace();
        }

        return null;
    }

    protected JavaPairRDD<String, String> getKafkaHashtags() {
        String query = "SELECT id, hashtag FROM tweet_hashtags";

        try {
            Statement stmt = connection.createStatement();

            List<Tuple2<String, String>> edgesList = new ArrayList<>();

            ResultSet rs = stmt.executeQuery(query);

            while (rs.next()) {
                String id = rs.getString("id");
                String hashtag = rs.getString("hashtag");
                edgesList.add(new Tuple2<String, String>(id, hashtag));
            }

            JavaRDD<Tuple2<String, String>> edges = context.parallelize(edgesList);

            return JavaPairRDD.fromJavaRDD(edges);
        } catch (SQLException e) {
            System.out.println("Query execution failed.");
            e.printStackTrace();
        }

        return null;
    }

    protected void uploadRankingsRaw(List<String[]> buffer) {
        try {
            connection.prepareStatement("DELETE FROM rankings WHERE 1").executeUpdate();

            String query = "INSERT INTO rankings (source, destination, score) VALUES ";
            for (String[] entry : buffer) {
                query += "('" + entry[0] + "', '" + entry[1] + "', " + entry[2] + ")";
                if (buffer.indexOf(entry) != buffer.size() - 1) {
                    query += ", ";
                }
            }
            PreparedStatement pstmt = connection.prepareStatement(query);

            pstmt.executeUpdate();
        } catch (SQLException e) {
            System.out.println("Query execution failed.");
            e.printStackTrace();
        }
    }

    protected void uploadRankings(List<Tuple2<Tuple2<String, String>, Double>> rankings) {
        List<String[]> buffer = new ArrayList<>();

        for (Tuple2<Tuple2<String, String>, Double> entry : rankings) {
            buffer.add(new String[] { entry._1._1, entry._1._2, entry._2.toString() });

            if (buffer.size() >= 1000) {
                uploadRankingsRaw(buffer);
                buffer.clear();
            }
        }

        if (buffer.size() > 0) {
            uploadRankingsRaw(buffer);
        }
    }

    /**
     * Main functionality in the program: read and process the social network
     * Runs the SocialRank algorithm to compute the ranks of nodes in a social
     * network.
     *
     * @param debug a boolean value indicating whether to enable debug mode
     * @return a list of tuples containing the node ID and its corresponding
     *         SocialRank value
     * @throws IOException          if there is an error reading the social network
     *                              data
     * @throws InterruptedException if the execution is interrupted
     */
    public List<Tuple2<Tuple2<String, String>, Double>> run(boolean debug) throws IOException, InterruptedException {
        getConnection();

        // Load the social network, aka. the edges (followed, follower)
        JavaPairRDD<String, String> friendsRDD = getFriends();
        JavaPairRDD<String, String> postsUsersRDD = getPostsUsers();
        JavaPairRDD<String, String> postsHashtagsRDD = getPostsHashtags();
        JavaPairRDD<String, String> usersHashtagsRDD = getUsersHashtags();
        JavaPairRDD<String, String> kafkaHashtagsRDD = getKafkaHashtags();

        JavaRDD<String> friendNodeRDD = friendsRDD.flatMap(x -> Arrays.asList(x._1, x._2).iterator()).distinct();

        JavaRDD<String> postNodeRDD = postsUsersRDD.flatMap(x -> Arrays.asList(x._1, x._2).iterator()).distinct();
        JavaRDD<String> hashtagNodeRDD = postsHashtagsRDD.flatMap(x -> Arrays.asList(x._1, x._2).iterator()).distinct();
        JavaRDD<String> userNodeRDD = usersHashtagsRDD.flatMap(x -> Arrays.asList(x._1, x._2).iterator()).distinct();
        JavaRDD<String> kafkaNodeRDD = kafkaHashtagsRDD.flatMap(x -> Arrays.asList(x._1, x._2).iterator()).distinct();

        JavaRDD<String> nodeRDD = friendNodeRDD.union(postNodeRDD).union(hashtagNodeRDD).union(userNodeRDD)
                .union(kafkaNodeRDD).distinct();
        nodeRDD.foreach(node -> {
            logger.info("Node: " + node);
        });

        JavaPairRDD<String, String> edgeRDD = friendsRDD.union(postsUsersRDD).union(postsHashtagsRDD)
                .union(usersHashtagsRDD).union(kafkaHashtagsRDD).distinct();
        // edgeRDD.foreach(node -> {
        // // Logging each node to the console using Log4j
        // logger.info("Key: " + node._1() + ", Value: " + node._2());
        // });
        JavaPairRDD<String, String> userPairs = friendNodeRDD.cartesian(nodeRDD);
        userPairs.foreach(node -> {
            // Logging each node to the console using Log4j
            logger.info("Key: " + node._1() + ", Value: " + node._2());
        });
        JavaRDD<Tuple2<String, String>> tuples = userPairs.map(x -> new Tuple2<>(x._1, x._2));

        JavaPairRDD<Tuple2<String, String>, String> withEdges = friendNodeRDD.cartesian(edgeRDD)
                .mapToPair(x -> new Tuple2<>(new Tuple2<>(x._1, x._2._1), x._2._2));

        JavaPairRDD<Tuple2<String, String>, Double> socialRankRDD = tuples
                .mapToPair(x -> new Tuple2<>(x, x._1.equals(x._2) ? 1.0 : 0.0));
        JavaRDD<Tuple2<String, Integer>> neighborCounts = edgeRDD.mapToPair(x -> new Tuple2<>(x._1, 1))
                .reduceByKey((x, y) -> x + y).map(x -> x);
        JavaPairRDD<Tuple2<String, String>, Integer> neighborCountsEdges = friendNodeRDD.cartesian(neighborCounts)
                .mapToPair(x -> new Tuple2<>(new Tuple2<>(x._1, x._2._1), x._2._2));
        double decayFactor = 0.15;
        for (int i = 0; i < i_max; i++) {
            JavaPairRDD<Tuple2<String, String>, Double> values = socialRankRDD.join(neighborCountsEdges)
                    .mapToPair(x -> new Tuple2<>(x._1, x._2._2 == 0 ? 0 : x._2._1 / x._2._2));

            JavaPairRDD<Tuple2<String, String>, Tuple2<String, Double>> withValues = withEdges.join(values);
            JavaPairRDD<Tuple2<String, String>, Double> newValues = withValues
                    .mapToPair(x -> new Tuple2<>(new Tuple2<>(x._1._1, x._2._1), x._2._2));
            JavaPairRDD<Tuple2<String, String>, Double> check = tuples
                    .mapToPair(x -> new Tuple2<>(x, x._1.equals(x._2) ? 1.0 : 0.0));
            JavaPairRDD<Tuple2<String, String>, Double> finalRDD = newValues.union(check);
            JavaPairRDD<Tuple2<String, String>, Double> total = finalRDD.reduceByKey((x, y) -> x + y);
            JavaPairRDD<Tuple2<String, String>, Double> newSocialRankRDD = total
                    .mapValues(x -> decayFactor + (1 - decayFactor) * x);
            double largestChange = socialRankRDD.join(newSocialRankRDD).mapToDouble(x -> Math.abs(x._2._1 - x._2._2))
                    .max();
            socialRankRDD = newSocialRankRDD;

            if (largestChange < d_max) {
                break;
            }
        }

        List<Tuple2<Tuple2<String, String>, Double>> rankings = socialRankRDD.collect();

        uploadRankings(rankings);

        return rankings;
    }

    public static void main(String[] args) {
        final FeedAdsorption ranks = new FeedAdsorption(0.01, 10, 1000, true);
        try {
            while (true) {
                ranks.initialize();
                ranks.run(true);
                Thread.sleep(10000);
            }

        } catch (final IOException ie) {
            logger.error("IO error occurred: " + ie.getMessage(), ie);
        } catch (final InterruptedException e) {
            logger.error("Interrupted: " + e.getMessage(), e);
        } finally {
            ranks.shutdown();
        }
    }
}
