exports = async function(arg){
  // This default function will get a value and find a document in MongoDB
  // To see plenty more examples of what you can do with functions see: 
  // https://www.mongodb.com/docs/atlas/app-services/functions/
const { format } = require('date-fns');
  // Find the name of the MongoDB service you want to use (see "Linked Data Sources" tab)
  const client = context.services.get("mongodb-atlas")
   const savingsColl = client.db("dbs_savings").collection("savings");
    
    const fromAfterAmount = await savingsColl.findOne({account_id: 1449828371});
        
    console.log(fromAfterAmount)
    return fromAfterAmount
};