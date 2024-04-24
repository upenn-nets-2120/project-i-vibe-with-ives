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
     * Fetch the social network from friends table, and create a (user1_id, user2_id)
     * edge graph
     *
     * @param filePath
     * @return JavaPairRDD: (followed: String, follower: String)
     */
    protected JavaPairRDD<String, String> getSocialNetwork(String filePath) {
        // JavaRDD<String> file = context.textFile(filePath, Config.PARTITIONS);

        // // TODO Load the file filePath into an RDD (take care to handle both spaces and
        // // tab characters as separators) 
        
        // JavaPairRDD<String, String> socialNetwork = file.flatMapToPair(line -> {
        //     String[] parts = line.split("\\s+");
        //     return Arrays.asList(new Tuple2<>(parts[1], parts[0])).iterator();
        // });

        // return socialNetwork;
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
        JavaPairRDD<String, String> edgeRDD = getSocialNetwork(Config.SOCIAL_NET_PATH);

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
        List<Tuple2<String, Double>> finalIdRanks = ranks.mapToPair(Tuple2::swap).sortByKey(false).mapToPair(Tuple2::swap);

        return finalIdRanks;

    }

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

    // public void writeResultsCsv(List<Tuple2<String, Double>> socialRanks) {
    //     // Create a new file to write the recommendations to
    //     File file = new File("socialrank-local.csv");
    //     try (PrintWriter writer = new PrintWriter(file)) {
    //         // Write the recommendations to the file
    //         for (Tuple2<String, Double> rank : socialRanks) {
    //             writer.println(rank._1 + " " + rank._2);
    //         }
    //     } catch (Exception e) {
    //         logger.error("Error writing ranks to file: " + e.getMessage(), e);
    //     }
    // }


}
