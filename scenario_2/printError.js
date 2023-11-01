import { MongoClient } from "mongodb";

const url =
  "mongodb+srv://sa:admin@dbs.qv1it.mongodb.net/?retryWrites=true&w=majority"; // Replace with your MongoDB connection string
const dbName = "your_database_name"; // Replace with your database name
const collectionName = "error_log"; // Replace with the name of your collection

const client = new MongoClient(url);

let counter = 0;
let hasLogChanged = 0;
async function readErrorLog() {
  try {
    await client.connect();
    const database = client.db("dbs_transactions_history");
    const errorLogCollection = database.collection("error_log");

    // Fetch data from the MongoDB collection
    const errorLogData = await errorLogCollection
      .find({})
      .sort({ transaction_time: -1 })
      .toArray();

    if (errorLogData.length > 0 && errorLogData.length !== hasLogChanged) {
      // Print each document as a JSON object
      console.log("\n");
      console.log(
        `################## New Records: Iteration ${
          counter + 1
        } #######################`
      );
      errorLogData.forEach((document, index) => {
        console.log("\n");
        console.log(`Record ${index + 1}:`);
        console.log(JSON.stringify(document, null, 2)); // Pretty-print JSON
        console.log("----------------------");
      });
      console.log("##################### END ############################");
      counter += 1;
      hasLogChanged = errorLogData.length;
    } else {
      console.log("No change detected.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

// Run the function in an infinite loop with a specified interval (e.g., every 5 seconds)
setInterval(readErrorLog, 1000);
