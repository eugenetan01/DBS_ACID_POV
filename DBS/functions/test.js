exports = async function(arg){
  // This default function will get a value and find a document in MongoDB
  // To see plenty more examples of what you can do with functions see: 
  // https://www.mongodb.com/docs/atlas/app-services/functions/
    const { format } = require('date-fns');
  // Find the name of the MongoDB service you want to use (see "Linked Data Sources" tab)
    const client = context.services.get("mongodb-atlas")
    const payerColl = client.db("dbs_payer").collection("accounts");
    const payeeColl = client.db("dbs_payee").collection("accounts");
    
    // add a new transactions collection
    const txnColl = client.db("dbs_transactions_history").collection("transactions");
    
    const session = client.startSession();
    
    const payer = 6844927457
    const payee = 9770119450
    const amount = 10
    
    var resp = null;
    
    let payerBefore = await payerColl.findOne(
        {account_id: payer});
    let payeeBefore = await payeeColl.findOne(
        {account_id: payee});
    
    try {
      session.startTransaction();
      
      // find the balance before the deduction in payee and payer account
      payerBefore = await payerColl.findOne(
        {account_id: payer},
        { session });
        
      console.log(payerBefore)
      
      payeeBefore = await payeeColl.findOne(
        {account_id: payee},
        { session });
        
      //console.log(payeeBefore)
      //console.log(payerBefore.balance);
      
      // If the payer's balance goes below 0, throw an error and exit transaction block
      const deductionAfter = payerBefore.balance - amount
      if (deductionAfter < 0) {
        throw new TypeError("Balance in payer is less than 0");
      }
      
      // update the new balance in payer by deducting amount from balance
      await payerColl.updateOne( 
        {account_id: payer}, 
        {$inc: {balance: (-1*amount) }}, 
        { session, returnNewDocument: true });
      
      // find the new balance after deduction in payer account
      const payerAfter = await payerColl.findOne(
        {account_id: payer},
        { session });
      
      //const fromAfter = await payerColl.findOneAndUpdate( // change back to findOne to show that we are actually reading the changes from the database 
      //  {account_id: from}, 
      //  {$inc: {balance: (-1*amount) }}, 
      //  { session, returnNewDocument: true });
      // update the new balance by adding amount to balance of payee account
      
      await payeeColl.updateOne(
        {account_id: payee}, 
        {$inc: {balance: amount }}, 
        { session, returnNewDocument: true });
      
      // find the new balance after adding amount in payee account
      const payeeAfter = await payeeColl.findOne(
        {account_id: payee},
        { session });
      
      // Add a new transaction to the dbs_transactions_history.transactions collection
      const now = new Date();
      const iso8601DateTime = now.toISOString();
      const parsedDate = new Date(iso8601DateTime);
      
      resp = {
        "status": 200,
        "from": payer,
        "payerBefore": payerBefore,
        "payerAfter": payerAfter,
        "to": payee,
        "payeeBefore": payeeBefore,
        "payeeAfter": payeeAfter,
        "amount": amount,
        "transaction_time": parsedDate
      }
      
      const res = await txnColl.insertOne(
        resp, 
        { session });
        
      
      //console.log("from: " + payer + " to: "+ payee + " transferred: " + amount);
      
      await session.commitTransaction();
      console.log("Transfer transaction committed.");
  
      
    } catch (error) {
      console.log("An error occurred during the transaction:" + error);
      await session.abortTransaction();
      const now = new Date();
      const iso8601DateTime = now.toISOString();
      const parsedDate = new Date(iso8601DateTime);
      
      resp = {
        "status": 501,
        "message": "An error occurred during the transaction:" + error,
        "payer": payerBefore, 
        "payee": payeeBefore,
        "amount": amount,
        "transaction_time":parsedDate
      }
      
      // add a error log collection for failed txn
      const errColl = client.db("dbs_transactions_history").collection("error_log");
      errColl.insertOne(resp)
      
    } finally {
      await session.endSession();
      return resp
    }
};