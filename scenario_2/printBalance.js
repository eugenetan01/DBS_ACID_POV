// Import necessary modules
import { MongoClient } from "mongodb";
import Table from "cli-table";

const url =
  "mongodb+srv://sa:admin@dbs.qv1it.mongodb.net/?retryWrites=true&w=majority"; // Replace with your MongoDB connection string
const payerDBName = "dbs_payer"; // Replace with your database name
const payeeDBName = "dbs_payee"; // Replace with your database name

const client = new MongoClient(url);

async function fetchAndDisplayData() {
  try {
    await client.connect();
    const payerDB = client.db(payerDBName);
    const payeeDB = client.db(payeeDBName);
    const payerCollection = payerDB.collection("accounts");
    const payeeCollection = payeeDB.collection("accounts");

    // Fetch data from MongoDB
    const payerData = await payerCollection.find({}).toArray();
    const payeeData = await payeeCollection.find({}).toArray();

    // Create an ASCII table
    const table = new Table({
      head: ["Payers", "Payees"],
      colWidths: [50, 50],
    });

    let payerBalances = [];
    let payeeBalances = [];
    // Format and populate the table
    payerData.forEach((payer, index) => {
      payerBalances.push(Math.trunc(payer["balance"]).toString());
      payeeBalances.push(Math.trunc(payeeData[index]["balance"]).toString());
    });
    table.push([payerBalances, payeeBalances]);
    console.log(table.toString());
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

// Run the function in an infinite loop with a specified interval (e.g., every 5 seconds)
setInterval(fetchAndDisplayData, 1000);
