// This function is the endpoint's request handler.
// This API handles ACID transactions by deducting an amount from balance in origin savings database and add the same amount to the destination current account database in a single transaction.

exports = async function({ query, headers, body}, response) {
    // Data can be extracted from the request as follows:
    // This is a binary object that can be accessed as a string using .text()
    const { format } = require('date-fns');
    const reqBody = body;
    const serialized = reqBody.text();
    // Parse the string into a usable object
    const parsedBody = JSON.parse(serialized);
    
    const client = context.services.get("mongodb-atlas")
    const savingsColl = client.db("dbs_savings").collection("savings");
    const currentColl = client.db("dbs_current").collection("current");
    
    // add a new transactions collection
    const txnColl = client.db("dbs_transactions_history").collection("transactions");
    
    const session = client.startSession();
    
    const from = parsedBody["from"];
    const to = parsedBody["to"];
    const amount = parsedBody["amount"];
    
    var resp = null;
    
    console.log(from);
    console.log(to);
    
    
    try {
      session.startTransaction();
      
      // find the balance before the deduction in origin savings account
      const fromBefore = await savingsColl.findOne(
        {account_id: from});
        
      console.log(fromBefore)
      
      // update the new balance by deducting amount from balance
      const fromAfter = await savingsColl.findOneAndUpdate(
        {account_id: from}, 
        {$inc: {balance: (-1*amount) }}, 
        { session, returnNewDocument: true });
      
      console.log(fromAfter)
      
      // find the new balance after deduction in origin savings account
      // const fromAfterAmount = await savingsColl.findOne(
      //  {account_id: from}).balance;
      
      // find the new balance before adding amount in destination current account
      const toBefore = await currentColl.findOne(
        {account_id: to});
        
      // update the new balance by adding amount to balance of destination current account
      const toAfter = await currentColl.findOneAndUpdate(
        {account_id: to}, 
        {$inc: {balance: amount }}, 
        { session, returnNewDocument: true });
      
      // find the new balance after deduction in destination current account
      //const toAfterAmount = await savingsColl.findOne(
      //  {account_id: to});
      
      // Add a new transaction to the dbs_transactions_history.transactions collection
      const now = new Date();
      const iso8601DateTime = now.toISOString();
      const parsedDate = new Date(iso8601DateTime);
      
      console.log(iso8601DateTime);

      await txnColl.insertOne(
        { 
          "origin": from,
          "destination": to,
          "amount": amount,
          "updated_time": parsedDate
        }, 
        { session });
      
      console.log("from: " + from + " to: "+ to + " transferred: " + amount);
      
      await session.commitTransaction();
      console.log("Transaction committed.");
      
      
      resp = {
        "status": 200,
        "from": from,
        "originBefore": fromBefore,
        "originAfter": fromAfter,
        "to": to,
        "destBefore": toBefore,
        "destAfter": toAfter,
      }
      
    
    } catch (error) {
      console.log("An error occurred during the transaction:" + error);
      await session.abortTransaction();
      
      resp = {
        "status": 501,
        "message": "An error occurred during the transaction:" + error,
      }
    } finally {
      await session.endSession();
      return resp
    }
}; 
