import pymongo
import json
import random

client = pymongo.MongoClient(
    "mongodb+srv://sa:admin@dbs.qv1it.mongodb.net/?retryWrites=true&w=majority"
)

db_payer = client.dbs_payer  # Use your database name
collection_payer = db_payer.accounts

print(collection_payer.find({})[random.randint(0, 99)])
