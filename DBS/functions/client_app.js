exports = async function(arg){
  // This default function will get a value and find a document in MongoDB
  // To see plenty more examples of what you can do with functions see: 
  // https://www.mongodb.com/docs/atlas/app-services/functions/
  const axios = require('axios');

  const client = context.services.get("mongodb-atlas")
  const payerColl = client.db("dbs_payer").collection("accounts");
  const payeeColl = client.db("dbs_payee").collection("accounts");
  const apiUrl = 'https://ap-southeast-1.aws.data.mongodb-api.com/app/dbs-gpnie/endpoint/casa/transfer'; // Replace with the API URL you want to call
  let amount = 10; 
  
  try {

    // Execute a FindOne in MongoDB 
    const payerIDs = await payerColl.find(
      {},
      {_id:0, account_id: 1}
    ).toArray();
    
    const payeeIDs = await payeeColl.find(
      {},
      {_id:0, account_id: 1}
    ).toArray();
    
    for(let i = 0; i<payerIDs.length; i++) {
      for(let j = 0; i<payeeIDs.length; i++){
        
        if (i==9 && j==9){
          amount = 20;
        }
        
        const body = {
            "payer": payerIDs[i]["account_id"],
            "payee": payeeIDs[j]["account_id"],
            "amount": amount
        }
                      
        axios.get(apiUrl, body)

      }
    }

  } catch(err) {
    console.log("Error occurred while executing find:", err.message);

    return { error: err.message };
  }

  // To call other named functions:
  // var result = context.functions.execute("function_name", arg1, arg2);

  return null;
};