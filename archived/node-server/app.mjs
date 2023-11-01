import express from "express";
import { MongoClient } from "mongodb";
import { format } from "date-fns";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const uri =
  "mongodb://0.0.0.0:27017,0.0.0.0:27018,0.0.0.0:27019/?replicaSet=myReplicaSet';";

const client = new MongoClient(uri, { useUnifiedTopology: true });

app.post("/transfer", async (req, res) => {
  try {
    await client.connect();
    const payerColl = client.db("dbs_payer").collection("accounts");
    const payeeColl = client.db("dbs_payee").collection("accounts");
    const txnColl = client
      .db("dbs_transactions_history")
      .collection("transactions");

    const { payer, payee, amount } = req.body;
    let resp = null;
    let payerBefore = null;
    let payeeBefore = null;

    const transactionOptions = {
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
      maxCommitTimeMS: 30000,
    };

    while (true) {
      const session = client.startSession();

      try {
        const result = await session.withTransaction(async (session) => {
          payerBefore = await payerColl.findOne(
            { account_id: payer },
            { session }
          );
          payeeBefore = await payeeColl.findOne(
            { account_id: payee },
            { session }
          );

          const deductionAfter = payerBefore.balance - amount;
          if (deductionAfter < 0) {
            throw new TypeError("Balance in payer is less than 0");
          }

          await payerColl.updateOne(
            { account_id: payer },
            { $inc: { balance: -1 * amount } },
            { session }
          );

          const payerAfter = await payerColl.findOne(
            { account_id: payer },
            { session }
          );

          await payeeColl.updateOne(
            { account_id: payee },
            { $inc: { balance: amount } },
            { session }
          );

          const payeeAfter = await payeeColl.findOne(
            { account_id: payee },
            { session }
          );

          const now = new Date();
          const iso8601DateTime = now.toISOString();
          const parsedDate = new Date(iso8601DateTime);

          resp = {
            status: 200,
            from: payer,
            payerBefore,
            payerAfter,
            to: payee,
            payeeBefore,
            payeeAfter,
            amount,
            transaction_time: parsedDate,
          };

          await txnColl.insertOne(resp, { session });
        }, transactionOptions);

        if (result) {
          console.log("Transfer transaction committed.");
          res.status(200).json(resp);
          break;
        } else {
          console.log("Transaction failed. Please check for errors");
        }
      } catch (error) {
        if (
          error.errorLabels &&
          error.errorLabels.includes("TransientTransactionError")
        ) {
          console.error("Transaction failed. Retrying...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          const payerAfter = await payerColl.findOne({ account_id: payer });
          const payeeAfter = await payeeColl.findOne({ account_id: payee });
          //await session.abortTransaction();

          const now = new Date();
          const iso8601DateTime = now.toISOString();
          const parsedDate = new Date(iso8601DateTime);

          resp = {
            status: 501,
            message: `An error occurred during the transaction: ${error}`,
            payerBefore,
            payerAfter,
            payeeBefore,
            payeeAfter,
            amount,
            transaction_time: parsedDate,
          };

          const errColl = client
            .db("dbs_transactions_history")
            .collection("error_log");
          await errColl.insertOne(resp);

          console.error("Non-retryable error:", error);
          res.status(501).json(resp);
          break;
        }
      } finally {
        await session.endSession();
      }
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
