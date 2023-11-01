import axios from "axios";
import { MongoClient } from "mongodb";

const url =
  "mongodb+srv://sa:admin@dbs.qv1it.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(url);

const payerColl = client.db("dbs_payer").collection("accounts");
const payeeColl = client.db("dbs_payee").collection("accounts");
const apiUrl =
  "https://ap-southeast-1.aws.data.mongodb-api.com/app/dbs-gpnie/endpoint/casa/transfer";
let amount = 10;

// Define a helper function to make the Axios request and wrap it in a Promise.
async function makePostRequest(url, body) {
  try {
    const response = await axios.post(url, body);
    return response.data; // You can return the response data or handle it as needed.
  } catch (error) {
    console.error("Error making POST request:", error.message);
    throw error; // Rethrow the error to be caught later if needed.
  }
}

async function run() {
  try {
    await client.connect();
    let tempPayer = null;
    let tempPayee = null;
    const payerIDs = await payerColl
      .find({}, { _id: 0, account_id: 1 })
      .toArray();
    const payeeIDs = await payeeColl
      .find({}, { _id: 0, account_id: 1 })
      .toArray();

    // Create an array of Promises for all the POST requests.
    const promises = [];

    // Run a for loop to deduct from 1 payer and add to all payees in order.
    for (let i = 0; i < payerIDs.length; i++) {
      for (let j = 0; j < payeeIDs.length; j++) {
        const body = {
          payer: payerIDs[i]["account_id"],
          payee: payeeIDs[j]["account_id"],
          amount: amount,
        };
        tempPayee = payeeIDs[j]["account_id"];
        tempPayer = payerIDs[i]["account_id"];
        promises.push(makePostRequest(apiUrl, body));
        await sleep(38); // To slow down concurrency to show the write conflict errors
      }
    }
    // Await all the POST requests concurrently.
    await Promise.all(promises);
  } catch (err) {
    console.log("Error occurred while executing find:", err.message);
    return { error: err.message };
  } finally {
    let extraBody = {
      payer: 1,
      payee: 1,
      amount: 120,
    };
    await makePostRequest(apiUrl, extraBody);
    await client.close();
  }

  function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    }); // Added a closing parenthesis here
  }
}

run().catch(console.error);
