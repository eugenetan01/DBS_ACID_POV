exports = async function(arg){
  // This default function will get a value and find a document in MongoDB
  // To see plenty more examples of what you can do with functions see: 
  // https://www.mongodb.com/docs/atlas/app-services/functions/
const { format } = require('date-fns');
  // Find the name of the MongoDB service you want to use (see "Linked Data Sources" tab)
  const client = context.services.get("mongodb-atlas")
   const savingsColl = client.db("dbs_transactions_history").collection("transactions");
   var resp = {
     
   }
   const res = await savingsColl.insertOne(
        resp, 
        );
        
    console.log(res.insertedId)
    
    resp = {
    "status": 200,
    "from": 1449828371,
    "payerBefore": {
        "_id": "652f7ef21d23a09d243c25be",
        "account_id": 1449828371,
        "name": "Melvin",
        "email": "keh@gaf.vi",
        "balance": "96.40000000000000"
    },
    "payeeAfter": {
      "_id": "652f7ef21d23a09d243c25be",
        "account_id": 1449828371,
        "name": "Melvin",
        "email": "keh@gaf.vi",
        "balance": "100"
    },
    "to": 1725503673,
    "payeeBefore": {
        "_id": "652f85d12f969dcce83b0148",
        "account_id": 1725503673,
        "name": "Lora",
        "email": "jit@ojovinkuv.et",
        "balance": "3.60000000000000"
    },
    "amount": 1.2
}
      
      await savingsColl.replaceOne(
        {"_id": res.insertedId}, 
        resp);
    //const document = await savingsColl.findOne({account_id: 1449828371});
  

    //if (document) {
      // Access the specific field and assign it to the 'result' variable
      //const result = document.balance; // Replace 'fieldName' with the actual field name
      //console.log('Result:', result);
    //} else {
      //console.log('Document not found');
    //}
    //return document
};