import pymongo
import time

client = pymongo.MongoClient(
    "mongodb+srv://sa:admin@dbs.qv1it.mongodb.net/?retryWrites=true&w=majority"
)

# Payer collection
db_payer = client.dbs_payer
collection_payer = db_payer.accounts

# Payee collection
db_payee = client.dbs_payee
collection_payee = db_payee.accounts

diff = 0

while True:
    payer_balance = collection_payer.find_one(
        {"account_id": 6844927457}, {"_id": 0, "balance": 1}
    )

    payee_balance = collection_payee.find_one(
        {"account_id": 9770119450}, {"_id": 0, "balance": 1}
    )

    if float(payer_balance["balance"]) < float(diff):
        print("############# CHANGED BALANCE ###################")
        print("Payer balance: " + str(payer_balance))
        print("Payee balance: " + str(payee_balance))
        break

    diff = payer_balance["balance"]
    print("Payer balance: " + str(payer_balance))
    print("Payee balance: " + str(payee_balance))

    time.sleep(1)
