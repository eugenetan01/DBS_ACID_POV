// This function is the endpoint's request handler.
// This API handles ACID transactions by deducting an amount from balance in origin savings database and add the same amount to the destination current account database in a single transaction.

exports = async function ({ query, headers, body }, response) {
  // Data can be extracted from the request as follows:
  // This is a binary object that can be accessed as a string using .text()
  const { format } = require("date-fns");
  const reqBody = body;
  const serialized = reqBody.text();
  // Parse the string into a usable object
  const parsedBody = JSON.parse(serialized);

  const client = context.services.get("mongodb-atlas");
  const payerColl = client.db("dbs_savings").collection("savings");
  const payeeColl = client.db("dbs_current").collection("current");

  // add a new transactions collection
  const txnColl = client
    .db("dbs_transactions_history")
    .collection("transactions");

  const session = client.startSession();
  const txnSession = client.startSession();

  const payer = parsedBody["payer"]; // 1449828371 //;
  const payee = parsedBody["payee"]; // 1725503673//;
  const amount = parsedBody["amount"]; // 1.2 //;

  var resp = null;

  try {
    session.startTransaction();

    // find the balance before the deduction in payee and payer account
    const payerBefore = await payerColl.findOne({ account_id: payer });

    console.log(payerBefore);

    const payeeBefore = await payeeColl.findOne({ account_id: payee });

    console.log(payeeBefore);

    console.log(payerBefore.balance);

    // If the payer's balance goes below 0, throw an error and exit transaction block
    const deductionAfter = payerBefore.balance - amount;
    if (deductionAfter < 0) {
      throw new TypeError("Balance in payer is less than 0");
    }

    // update the new balance in payer by deducting amount from balance
    await payerColl.updateOne(
      { account_id: payer },
      { $inc: { balance: -1 * amount } },
      { session, returnNewDocument: true }
    );

    // update the new balance by adding amount to balance of payee account
    await payeeColl.updateOne(
      { account_id: payee },
      { $inc: { balance: amount } },
      { session, returnNewDocument: true }
    );

    //const fromAfter = await payerColl.findOneAndUpdate( // change back to findOne to show that we are actually reading the changes from the database
    //  {account_id: from},
    //  {$inc: {balance: (-1*amount) }},
    //  { session, returnNewDocument: true });

    // Add a new transaction to the dbs_transactions_history.transactions collection
    const now = new Date();
    const iso8601DateTime = now.toISOString();
    const parsedDate = new Date(iso8601DateTime);

    resp = {
      status: 200,
      from: payer,
      payerBefore: payerBefore,
      //"payerAfter": payerAfter,
      to: payee,
      payeeBefore: payeeBefore,
      //"payeeAfter": payeeAfter,
      amount: amount,
    };

    const res = await txnColl.insertOne(resp, { session });

    console.log("from: " + payer + " to: " + payee + " transferred: " + amount);

    await session.commitTransaction();
    console.log("Transfer transaction committed.");

    // Start a new session to find the new amounts after txn has ended and add it to txn history
    txnSession.startTransaction();

    // find the new balance after deduction in payer account
    const payerAfter = await payerColl.findOne({ account_id: payer });

    // find the new balance after adding amount in payee account
    const payeeAfter = await payeeColl.findOne({ account_id: payee });

    resp = {
      status: 200,
      from: payer,
      payerBefore: payerBefore,
      payerAfter: payerAfter,
      to: payee,
      payeeBefore: payeeBefore,
      payeeAfter: payeeAfter,
      amount: amount,
    };

    await txnColl.replaceOne({ _id: res.insertedId }, resp, { txnSession });

    await txnSession.commitTransaction();
    console.log("Transactions history transaction committed.");
  } catch (error) {
    console.log("An error occurred during the transaction:" + error);
    await session.abortTransaction();
    await txnSession.abortTransaction();

    resp = {
      status: 501,
      message: "An error occurred during the transaction:" + error,
    };
  } finally {
    await session.endSession();
    await txnSession.endSession();
    return resp;
  }
};
