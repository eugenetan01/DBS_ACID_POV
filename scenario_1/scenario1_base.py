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
        {"account_id": 1}, {"_id": 0, "balance": 1}
    )

    payee_balance = collection_payee.find_one(
        {"account_id": 1}, {"_id": 0, "balance": 1}
    )

    decimal_value = payer_balance["balance"].to_decimal()

    if float(str(decimal_value)) < float(diff):
        print("############# CHANGED BALANCE ###################")
        print("Payer balance: " + str(payer_balance))
        print("Payee balance: " + str(payee_balance))
        break

    diff = decimal_value
    print("####################################################")
    print("Payer balance: " + str(payer_balance))
    print("Payee balance: " + str(payee_balance))

    time.sleep(1)
