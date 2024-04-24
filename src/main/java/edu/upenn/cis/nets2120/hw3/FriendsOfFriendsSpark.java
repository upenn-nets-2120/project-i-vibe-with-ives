package edu.upenn.cis.nets2120.hw3;

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
import edu.upenn.cis.nets2120.storage.SparkConnector;
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

public class FriendsOfFriendsSpark {
    static Logger logger = LogManager.getLogger(FriendsOfFriendsSpark.class);

    /**
     * Connection to Apache Spark
     */
    SparkSession spark;
    JavaSparkContext context;

    public FriendsOfFriendsSpark() {
        System.setProperty("file.encoding", "UTF-8");
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
     * Fetch the social network from mysql using a JDBC connection, and create a (followed, follower) edge graph
     *
     * @return JavaPairRDD: (followed: String, follower: String) The social network
     */
    public JavaPairRDD<String, String> getSocialNetworkFromJDBC() {
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

            // TODO: After connecting successfully, use SQL queries to get the first 10000
            //  rows of the friends table you created when sorting the `followed` column in
            //  ASC order. Then parallelize the data you get and return a JavaPairRDD object.

            Statement statement = connection.createStatement();
            ResultSet resultSet = statement.executeQuery("SELECT DISTINCT followed, follower FROM friends ORDER BY followed ASC LIMIT 10000;");
            List<Tuple2<String, String>> data = new ArrayList<>();
            while (resultSet.next()) {
                data.add(new Tuple2<>(resultSet.getString("followed"), resultSet.getString("follower")));
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
     * Send recommendation results back to the database
     *
     * @param recommendations List: (followed: String, follower: String)
     *                        The list of recommendations to send back to the database
     */
    public void sendResultsToDatabase(List<Tuple2<Tuple2<String, String>, Integer>> recommendations) {

        String insertQuery = "INSERT INTO recommendations (user1_id, recommendation, strength) VALUES (?, ?, ?)";

        try (Connection connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                Config.DATABASE_PASSWORD)) {


            // create recommendations_2 table if it doesn't exist
            try (Statement statement = connection.createStatement()) {
                statement.executeUpdate("CREATE TABLE recommendations (user1_id VARCHAR(10), recommendation VARCHAR(10), strength INT, PRIMARY KEY(person, recommendation), FOREIGN KEY (person) REFERENCES names(nconst), FOREIGN KEY (recommendation) REFERENCES names(nconst));");
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

    /**
     * Write the recommendations to a CSV file. Do not modify this method.
     *
     * @param recommendations List: (followed: String, follower: String)
     */
    public void writeResultsCsv(List<Tuple2<Tuple2<String, String>, Integer>> recommendations) {
        // Create a new file to write the recommendations to
        File file = new File("recommendations_2.csv");
        try (PrintWriter writer = new PrintWriter(file)) {
            // Write the recommendations to the file
            for (Tuple2<Tuple2<String, String>, Integer> recommendation : recommendations) {
                writer.println(recommendation._1._1 + "," + recommendation._1._2 + "," + recommendation._2);
            }
        } catch (Exception e) {
            logger.error("Error writing recommendations to file: " + e.getMessage(), e);
        }
    }

    /**
     * Main functionality in the program: read and process the social network. Do not modify this method.
     *
     * @throws IOException          File read, network, and other errors
     * @throws InterruptedException User presses Ctrl-C
     */
    public void run() throws IOException, InterruptedException {
        logger.info("Running");

        // Load the social network:
        // Format of JavaPairRDD = (followed, follower)
        JavaPairRDD<String, String> network = getSocialNetworkFromJDBC();

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
        writeResultsCsv(collectedRecommendations);
        sendResultsToDatabase(collectedRecommendations);

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
        final FriendsOfFriendsSpark fofs = new FriendsOfFriendsSpark();
        try {
            fofs.initialize();
            fofs.run();
        } catch (final IOException ie) {
            logger.error("IO error occurred: " + ie.getMessage(), ie);
        } catch (final InterruptedException e) {
            logger.error("Interrupted: " + e.getMessage(), e);
        } finally {
            fofs.shutdown();
        }
    }
}
