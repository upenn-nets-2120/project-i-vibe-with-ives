const dbaccess = require("./db_access");
const config = require("../config.json"); // Load configuration
const fs = require('fs');
const path = require('path');


const tsvFilePath = "actor-data/names.tsv";

// const tsvFilePath = path.resolve(__dirname, "../actor-data/names.tsv");

// if (fs.existsSync(tsvFilePath)) {
//     console.log("File exists at:", tsvFilePath);
// } else {
//     console.log("File does not exist at:", tsvFilePath);
// }

async function populateNamesTable() {
    try {
        const csvData = fs.readFileSync(tsvFilePath, 'utf-8');

        // Split CSV data by newlines and parse each line
        const rows = csvData.trim().split('\r\n').map(row => row.split('\t'));

        // const rows = csvData.trim().split('\n').map(row => 
        //     row.trim().split('\t').map(field => field.trim())
        // );
        // Assuming the first row of the CSV contains column headers
        const columns = rows.shift();

        // Generate the INSERT query dynamically
        let insertQuery = `INSERT INTO names (nconst, primaryName, birthYear, deathYear) VALUES `;
        rows.forEach(row => {
            let safeValues = row.map(value => value.replace(/'/g, "''")); // Replace single quotes with two single quotes
            insertQuery += `('${safeValues[0]}', '${safeValues[1]}', '${safeValues[2]}', '${safeValues[3]}'),`;
        });

        insertQuery = insertQuery.slice(0, -1);
        insertQuery += ";";
        console.log("Finished creating query");

        await dbaccess.insert_items(insertQuery);
        console.log("Finished adding items");
    } catch (error) {
        console.error("Error while populating names table:", error);
    }
}

async function main() {
    try {
        // Database connection setup
        const db = dbaccess.get_db_connection();
        await populateNamesTable();
        console.log('Populated');
        dbaccess.close_db();
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

main().catch(error => console.error("Unhandled error:", error));

const PORT = config.serverPort;