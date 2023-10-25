var s1 = db.getMongo().startSession();
var s2 = db.getMongo().startSession();
var s1Payer = s1.getDatabase("dbs_payer").getCollection("accounts");
var s2Payer = s2.getDatabase("dbs_payer").getCollection("accounts");
var s1Payee = s1.getDatabase("dbs_payee").getCollection("accounts");
var s2Payee = s2.getDatabase("dbs_payee").getCollection("accounts");

s1.startTransaction();

// Insert player 3, inside a transaction/session1
s1Payer.updateOne(
  { account_id: 6844927457 },
  { $inc: { balance: -1 * NumberDecimal("10.0") } }
);

// Use session 2 and find the documents from collection and session1
s2Payer.findOne({ account_id: 6844927457 });
// EXPECTED RESULT:
// { account_id: 6844927457 } balance should still be 100

// Notice that the update on session1 is only visible to it.
s1Payer.find({ account_id: 6844927457 });
// EXPECTED RESULT:
// { account_id: 6844927457 } balance should be 90

s1Payee.updateOne(
  { account_id: 9770119450 },
  { $inc: { balance: NumberDecimal("10.0") } }
);

// Use session 2 and find the documents from collection and session1
s2Payee.find({ account_id: 9770119450 });
// EXPECTED RESULT:
// { account_id: 9770119450 } balance should still be 0

// Notice that the update on session1 is only visible to it.
s1Payee.find({ account_id: 9770119450 });
// EXPECTED RESULT:
// { account_id: 9770119450 } balance should be 10

// Commit & end the session (if not committed within 60 secs transaction will timeout)
s1.commitTransaction();

// show the documents after committing the transaction
s2Payer.find({ account_id: 6844927457 });
s2Payee.find({ account_id: 9770119450 });
// EXPECTED RESULT: { account_id: 9770119450 } balance should be 10
s1.endSession();
s2.endSession();
