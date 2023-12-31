// This function is the endpoint's request handler.
// This API handles ACID transactions by deducting an amount from balance in origin savings database and add the same amount to the destination current account database in a single transaction.

exports = async function ({ query, headers, body }, response) {
  const { format } = require("date-fns");
  const reqBody = body;
  const serialized = reqBody.text();
  const parsedBody = JSON.parse(serialized);

  const client = context.services.get("mongodb-atlas");
  const payerColl = client.db("dbs_payer").collection("accounts");
  const payeeColl = client.db("dbs_payee").collection("accounts");

  // add a new transactions collection
  const txnColl = client
    .db("dbs_transactions_history")
    .collection("transactions");

  const payer = parsedBody["payer"]; // 1449828371 //;
  const payee = parsedBody["payee"]; // 1725503673//;
  const amount = parsedBody["amount"]; // 1.2 //;

  var resp = null;
  let payerBefore = null;
  let payeeBefore = null;

  const transactionOptions = {
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" },
    maxCommitTimeMS: 30000,
  };

  const session = client.startSession();

  try {
    await session.withTransaction(async (session) => {
      resp = await makeTransfer(session, payerColl, payeeColl);
    }, transactionOptions);

    console.log(resp);

    console.log("Transfer transaction committed.");
  } catch (error) {
    resp = errorHandling(payerColl, payeeColl, error);
  } finally {
    //await session.endSession();
    return resp;
  }

  async function makeTransfer(session, payerColl, payeeColl) {
    payerBefore = await payerColl.findOne({ account_id: payer }, { session });

    payeeBefore = await payeeColl.findOne({ account_id: payee }, { session });

    //console.log(payeeBefore)
    //console.log(payerBefore.balance);

    // If the payer's balance goes below 0, throw an error and exit transaction block
    const deductionAfter = payerBefore.balance - amount;
    if (deductionAfter < 0) {
      throw new TypeError("Balance in payer is less than 0");
    }

    // update the new balance in payer by deducting amount from balance
    await payerColl.updateOne(
      { account_id: payer },
      { $inc: { balance: -1 * amount } },
      { session }
    );

    // find the new balance after deduction in payer account
    const payerAfter = await payerColl.findOne(
      { account_id: payer },
      { session }
    );

    //const fromAfter = await payerColl.findOneAndUpdate( // change back to findOne to show that we are actually reading the changes from the database
    //  {account_id: from},
    //  {$inc: {balance: (-1*amount) }},
    //  { session, returnNewDocument: true });
    // update the new balance by adding amount to balance of payee account

    await payeeColl.updateOne(
      { account_id: payee },
      { $inc: { balance: amount } },
      { session }
    );

    // find the new balance after adding amount in payee account
    const payeeAfter = await payeeColl.findOne(
      { account_id: payee },
      { session }
    );

    // Add a new transaction to the dbs_transactions_history.transactions collection
    const now = new Date();
    const iso8601DateTime = now.toISOString();
    const parsedDate = new Date(iso8601DateTime);

    const resp = {
      status: 200,
      from: payer,
      payerBefore: payerBefore,
      payerAfter: payerAfter,
      to: payee,
      payeeBefore: payeeBefore,
      payeeAfter: payeeAfter,
      amount: amount,
      transaction_time: parsedDate,
    };

    const res = await txnColl.insertOne(resp, { session });
    console.log("resp:" + resp);

    return resp;
  }

  async function errorHandling(payerColl, payeeColl, error) {
    // get the current balance in payer account after txn block failed
    //const payerAfter = await payerColl.findOne({ account_id: payer });

    // get the current balance in payer account after txn block failed
    //const payeeAfter = await payeeColl.findOne({ account_id: payee });

    await session.abortTransaction();

    console.log("An error occurred during the transaction:" + error);
    const now = new Date();
    const iso8601DateTime = now.toISOString();
    const parsedDate = new Date(iso8601DateTime);

    const resp = {
      status: 501,
      message: "An error occurred during the transaction:" + error,
      payerBefore: payerBefore,
      //payerAfter: payerAfter,
      payeeBefore: payeeBefore,
      //payeeAfter: payeeAfter,
      amount: amount,
      transaction_time: parsedDate,
    };

    // add a error log collection for failed txn
    const errColl = client
      .db("dbs_transactions_history")
      .collection("error_log");
    await errColl.insertOne(resp);
    console.error("Non-retryable error:", error);

    return resp;
  }
};
