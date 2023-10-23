import pymongo
import json
import random
import requests

client = pymongo.MongoClient(
    "mongodb+srv://sa:admin@dbs.qv1it.mongodb.net/?retryWrites=true&w=majority"
)

db_payer = client.dbs_payer  # Use your database name
collection_payer = db_payer.accounts

db_payee = client.dbs_payee  # Use your database name
collection_payee = db_payee.accounts

# print(collection_payer.find({})[random.randint(0, 99)])

payer = collection_payer.find({}, {"_id": 0, "account_id": 1})[random.randint(0, 99)]
payee = collection_payee.find({}, {"_id": 0, "account_id": 1})[random.randint(0, 99)]
# Get the record from the target collection now
amount = 10

print(payer)
print(payee)

if random.randint(1, 10) == 5:
    amount = 120

body = {"payer": payer["account_id"], "payee": payee["account_id"], "amount": amount}
json_data = json.dumps(body)

response = requests.post(
    "https://ap-southeast-1.aws.data.mongodb-api.com/app/dbs-gpnie/endpoint/casa/transfer",
    data=json_data,
)

print(response.text)
