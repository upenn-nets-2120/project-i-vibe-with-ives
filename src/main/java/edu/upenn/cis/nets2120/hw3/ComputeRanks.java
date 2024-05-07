package edu.upenn.cis.nets2120.hw3;

import java.io.IOException;
import java.io.PrintWriter;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;

import com.google.cloud.hadoop.repackaged.gcs.com.google.common.collect.Iterables;

import java.io.File;

import edu.upenn.cis.nets2120.config.Config;

import scala.Tuple2;

import java.util.*;
import java.lang.Math;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.*;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.SparkSession;

import edu.upenn.cis.nets2120.config.Config;
import edu.upenn.cis.nets2120.engine.SparkConnector;
import scala.Tuple2;

import java.sql.Connection;
import java.sql.Statement;
import java.sql.ResultSet;
import java.sql.PreparedStatement;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.apache.spark.api.java.JavaRDD;

public class ComputeRanks extends SparkJob<List<Tuple2<String, Double>>> {
    /**
     * The basic logger
     */
    static Logger logger = LogManager.getLogger(ComputeRanks.class);

    // Convergence condition variables
    protected double d_max; // largest change in a node's rank from iteration i to iteration i+1
    protected int i_max; // max number of iterations
    int max_answers = 1000;

    public ComputeRanks(double d_max, int i_max, int answers, boolean debug) {
        super(true, true, debug);
        this.d_max = d_max;
        this.i_max = i_max;
        this.max_answers = answers;
    }

    /**
     * Initialize the database connection. Do not modify this method.
     *
     * @throws InterruptedException User presses Ctrl-C
     */
    public void initialize() throws InterruptedException {
        logger.info("Connecting to Spark...");

        spark = SparkConnector.getSparkConnection();
        context = SparkConnector.getSparkContext();

        logger.debug("Connected!");
    }

    /**
     * Fetch the social network from friends table, and create a (user1_id, user2_id)
     * edge graph
     *
     * @param filePath
     * @return JavaPairRDD: (followed: String, follower: String)
     */
    protected JavaPairRDD<String, String> getSocialNetwork() {
        try {
            logger.info("Connecting to database...");
            Connection connection = null;

            try {
                connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                        Config.DATABASE_PASSWORD);
            } catch (SQLException e) {
                logger.error("Connection to database failed: " + e.getMessage(), e);
                logger.error("Please make sure the RDS server is correct, the tunnel is enabled, and you have run the mysql command to create the database.");
                System.exit(1);
            }

            if (connection == null) {
                logger.error("Failed to make connection - Connection is null");
                System.exit(1);
            }

            logger.info("Successfully connected to database!");

            Statement statement = connection.createStatement();
            ResultSet resultSet = statement.executeQuery("SELECT DISTINCT user1_id, user2_id FROM friends ORDER BY user1_id ASC;");
            List<Tuple2<String, String>> data = new ArrayList<>();
            while (resultSet.next()) {
                // add bidirectional edges for each friend pairing
                data.add(new Tuple2<>(resultSet.getString("user1_id"), resultSet.getString("user2_id")));
                data.add(new Tuple2<>(resultSet.getString("user2_id"), resultSet.getString("user1_id")));
            }
            JavaPairRDD<String, String> network = context.parallelizePairs(data);
            return network;

        } catch (Exception e) {
            logger.error("SQL error occurred: " + e.getMessage(), e);
        }
        // Return a default value if the method cannot return a valid result
        return context.emptyRDD().mapToPair(x -> new Tuple2<>("", ""));

    }

    /**
     * Retrieves the sinks in the provided graph.
     *
     * @param network The input graph represented as a JavaPairRDD.
     * @return A JavaRDD containing the nodes with no outgoing edges.
     */
    protected JavaRDD<String> getSinks(JavaPairRDD<String, String> network) {
        // TODO Find the sinks in the provided graph
        JavaPairRDD<String, String> reversed = network.mapToPair(Tuple2::swap);

        //subtract first column of reversed with first column of network and store in JavaRDD
        JavaRDD<String> sinks = network.keys().subtract(reversed.keys()).distinct();
        return sinks;
    }

    /**
     * Friend-of-a-Friend Recommendation Algorithm
     *
     * @param network JavaPairRDD: (followed: String, follower: String) The social network
     * @return JavaPairRDD: ((person, recommendation), strength) The friend-of-a-friend recommendations
     */
    private JavaPairRDD<Tuple2<String, String>, Integer> friendOfAFriendRecommendations(
            JavaPairRDD<String, String> network) {
        // TODO: Generate friend-of-a-friend recommendations by computing the set of 2nd-degree followed users. This
        //  method should do the same thing as the `friendOfAFriendRecommendations` method in the
        //  `FriendsOfFriendsStreams` class, but using Spark's RDDs instead of Java Streams.

        JavaPairRDD<String, String> reversed = network.mapToPair(Tuple2::swap);
        JavaPairRDD<String, Tuple2<String, String>> merged = network.join(reversed);
        
        JavaPairRDD<String, String> filtered = merged.filter(pair -> !pair._2()._1().equals(pair._2()._2()))
                                                      .mapToPair(pair -> new Tuple2<>(pair._2()._1(), pair._2()._2()));
        
        //filter out first degree connections
        filtered = filtered.subtract(reversed);
        
        JavaPairRDD<Tuple2<String, String>, Integer> finalRDD = filtered.mapToPair(pair -> new Tuple2<>(pair, 1))
                                                                       .reduceByKey(Integer::sum);
    
        return finalRDD;
    
    }

    /**
     * Main functionality in the program: read and process the social network
     * Runs the SocialRank algorithm to compute the ranks of nodes in a social network.
     *
     * @param debug a boolean value indicating whether to enable debug mode
     * @return a list of tuples containing the node ID and its corresponding SocialRank value
     * @throws IOException          if there is an error reading the social network data
     * @throws InterruptedException if the execution is interrupted
     */
    public List<Tuple2<String, Double>> run(boolean debug) throws IOException, InterruptedException {

        // Load the social network, aka. the edges (followed, follower)
        JavaPairRDD<String, String> edgeRDD = getSocialNetwork();



        // Find the sinks in edgeRDD as PairRDD
        JavaRDD<String> sinks = getSinks(edgeRDD);
        logger.info("This graph contains {} nodes and {} edges", edgeRDD.keys().union(edgeRDD.values()).distinct().count(), edgeRDD.count());
        logger.info("There are {} sinks", sinks.count());

        //add backlinks
        JavaPairRDD<String, Integer> dummy = sinks.mapToPair(sink -> new Tuple2<>(sink, 1));
        JavaPairRDD<String, String> toRemove = edgeRDD.subtractByKey(dummy);
        JavaPairRDD<String, String> sinkEdges = edgeRDD.subtractByKey(toRemove);
        JavaPairRDD<String, String> backlinks = sinkEdges.mapToPair(Tuple2::swap);
        logger.info("Added {} backlinks", backlinks.count());

        //final edge table
        JavaPairRDD<String, String> graph = edgeRDD.union(backlinks).distinct();
        double decay = 0.15;

        // not adding backlinks for simple-example.txt
        // graph = edgeRDD.distinct();
              
        JavaPairRDD<String, Double> ranks = graph.keys().distinct().mapToPair(node -> new Tuple2<>(node, 1.0));
        JavaPairRDD<String, Double> oldRanks = ranks;
        JavaPairRDD<String, Iterable<String>> groupedGraph = graph.mapToPair(Tuple2::swap).groupByKey();

        // Perform several iterations of rank computation
        for (int i = 0; i < i_max; i++) {
            // determine contribution FROM each node TO all its following
            JavaPairRDD<String, Double> contributions = groupedGraph.join(oldRanks).flatMapToPair(node -> {
                Iterable<String> following = node._2._1();
                Double rank = node._2._2();
                double contribution = rank / Iterables.size(following);
                List<Tuple2<String, Double>> list = new ArrayList<>();
                for (String followedVertex : following) {
                    list.add(new Tuple2<>(followedVertex, contribution));
                }
                return list.iterator();
            });


            // use contributions from each node to update ranks
            ranks = contributions
                    .reduceByKey(Double::sum)
                    .mapValues(rankSum -> decay + (1 - decay) * rankSum);

            if (debug) {
                List<Tuple2<String, Double>> rankCollect = ranks.collect();
                for (Tuple2<String, Double> node : rankCollect) {
                    logger.info("Node: {}, Rank: {}", node._1(), node._2());
                 }
            }
            
            // compute max difference, check against d_max
            JavaPairRDD<String, Double> diff = ranks.join(oldRanks).mapValues(r -> Math.abs(r._1() - r._2()));
            Tuple2<String, Double> max = diff.reduce((a, b) -> {
                if (a._2 > b._2) {
                    return a;
                } else {
                    return b;
                }
            });

            if (max._2() < d_max) break;
            oldRanks = ranks;

        }

        //Output the top 1000 node IDs with the highest SocialRank values, as well as the SocialRank value of each. The output should consist of 1000 lines of the form x y, where x is a node ID and y is the socialRank of x; the lines should be ordered by SocialRank in descending order.
        List<Tuple2<String, Double>> finalIdRanks = ranks.mapToPair(Tuple2::swap).sortByKey(false).mapToPair(Tuple2::swap).take(ranks.collect().size());

        sendRankResultsToDatabase(finalIdRanks);

        return finalIdRanks;

    }

    public void sendRankResultsToDatabase(List<Tuple2<String, Double>> recommendations) {

        String insertQuery = "INSERT INTO social_rank (user_id, social_rank) VALUES (?, ?)";

        try (Connection connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                Config.DATABASE_PASSWORD)) {


            try (Statement statement = connection.createStatement()) {
                statement.executeUpdate("CREATE TABLE IF NOT EXISTS social_rank (user_id INT, social_rank FLOAT, FOREIGN KEY (user_id) REFERENCES users(user_id));");
            }

            // delete from social rank
            try (Statement statement = connection.createStatement()) {
                statement.executeUpdate("DELETE FROM social_rank;");
            }

            // TODO: Write your recommendations data back to imdbdatabase.
            try (PreparedStatement preparedStatement = connection.prepareStatement(insertQuery)) {
            // Iterate over recommendations and insert each one into the database
                for (Tuple2<String, Double> recommendation : recommendations) {
                    String user = recommendation._1();
                    double rank = recommendation._2();

                    // Set parameters for the prepared statement
                    preparedStatement.setString(1, user);
                    preparedStatement.setDouble(2, rank);

                    // Execute the INSERT statement
                    preparedStatement.executeUpdate();
                }
            }
            // connection.commit();
        } catch (SQLException e) {
            logger.error("Error sending recommendations to database: " + e.getMessage(), e);
        }
    }

    /**
     * Send friend of a friend recommendations results back to the database
     *
     * @param recommendations List: (followed: String, follower: String)
     *                        The list of recommendations to send back to the database
     */
    public void sendFoafResultsToDatabase(List<Tuple2<Tuple2<String, String>, Integer>> recommendations) {

        String insertQuery = "INSERT INTO recommendations (user_id, recommendation, strength) VALUES (?, ?, ?)";

        try (Connection connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                Config.DATABASE_PASSWORD)) {

            // create recommendations_2 table if it doesn't exist
            try (Statement statement = connection.createStatement()) {
                statement.executeUpdate("CREATE TABLE IF NOT EXISTS recommendations (user_id INT, recommendation INT, strength INT, FOREIGN KEY (user_id) REFERENCES users(user_id), FOREIGN KEY (recommendation) REFERENCES users(user_id));");
            }

            // clear old friend recommendations
            try (Statement statement = connection.createStatement()) {
                statement.executeUpdate("DELETE FROM recommendations;");
            }

            // TODO: Write your recommendations data back to imdbdatabase.
            try (PreparedStatement preparedStatement = connection.prepareStatement(insertQuery)) {
            // Iterate over recommendations and insert each one into the database
                for (Tuple2<Tuple2<String, String>, Integer> recommendation : recommendations) {
                    String followed = recommendation._1()._1();
                    String follower = recommendation._1()._2();
                    int strength = recommendation._2();

                    // Set parameters for the prepared statement
                    preparedStatement.setString(1, followed);
                    preparedStatement.setString(2, follower);
                    preparedStatement.setInt(3, strength);

                    // Execute the INSERT statement
                    preparedStatement.executeUpdate();
                }
            }
            // connection.commit();
        } catch (SQLException e) {
            logger.error("Error sending recommendations to database: " + e.getMessage(), e);
        }
    }

    public void runFoaf() throws IOException, InterruptedException {
        logger.info("Running");

        // Load the social network:
        // Format of JavaPairRDD = (followed, follower)
        JavaPairRDD<String, String> network = getSocialNetwork();

        // Friend-of-a-Friend Recommendation Algorithm:
        // Format of JavaPairRDD = ((person, recommendation), strength)
        JavaPairRDD<Tuple2<String, String>, Integer> recommendations = friendOfAFriendRecommendations(network);

        // Collect results and send results back to database:
        // Format of List = ((person, recommendation), strength)
        if (recommendations == null) {
            logger.error("Recommendations are null");
            return;
        }
        List<Tuple2<Tuple2<String, String>, Integer>> collectedRecommendations = recommendations.collect();
        // writeResultsCsv(collectedRecommendations);
        sendFoafResultsToDatabase(collectedRecommendations);

        logger.info("*** Finished friend of friend recommendations! ***");
    }


    /**
     * Graceful shutdown
     */
    public void shutdown() {
        logger.info("Shutting down");

        if (spark != null) {
            spark.close();
        }
    }

    public static void main(String[] args) {
        final ComputeRanks friendRecs = new ComputeRanks(0.01, 10, 1000, true);
        try {
            while (true) {
                friendRecs.initialize();
                friendRecs.runFoaf();
                friendRecs.run(true);
                Thread.sleep(86400000);
            }
            
        } catch (final IOException ie) {
            logger.error("IO error occurred: " + ie.getMessage(), ie);
        } catch (final InterruptedException e) {
            logger.error("Interrupted: " + e.getMessage(), e);
        } finally {
            friendRecs.shutdown();
        }
    }


}
