# DBS_ACID_POV

# CLUSTER TO CLUSTER SYNC

**Ability to achieve ACID transactions with MongoDB**

**SA Maintainer**: [Eugene Tan](mailto:eugene.tan@mongodb.com) <br/>
**Time to setup**: 10 mins <br/>
**Time to execute**: 15 mins <br/>

---

## Description

This proof shows how you can achieve MongoDB ACID transactions with the Core transaction and Callback transaction API

For this proof, an Atlas cluster will be loaded with [sample data](https://docs.atlas.mongodb.com/sample-data/). The **payers** and **payees** collection will reside individually in its own databases, and we will simulate transferring money from payers to payees. There will also be a Transactions History database to capture all successful transactions and errors.

This proof shows that you can achieve ACID guarantees on a transaction, and how errors are handled and transactions are rolled back during such events.

---

## Setup

**1. Configure Atlas Environment**

- Log-on to your [Atlas account](http://cloud.mongodb.com) (using the MongoDB SA preallocated Atlas credits system) and navigate to your SA project
- In the project's Security tab, choose to add a new user, configure database user “ADMIN” with role “Atlas Admin”
- In the Security tab, add a new **IP Whitelist** for your laptop's current IP address
- Create an **M10** based 3 node replica-set in **AWS**, running on version 6.0 and name it **DBS** in **SG** region
- In the Atlas console, for the database cluster you deployed, click the **Connect button**, select **Connect Your Application**, and for the **latest Node.js version** copy the **Connection String Only** - make a note of this MongoDB URL address to be used in the next step for both clusters created

**2. Create Collection In The Atlas Cluster**
- Create a database.collection called dbs_payer.accounts
- create these 2 indexes for this database:
  ```
  {“balance”: 1}
  {“account_id”: 1}
  ```
- Create a database.collection called dbs_payee.accounts
- Create these 2 indexes for this database:
  ```
  {“balance”: 1}
  {“account_id”: 1}
  ```
- Create a database called dbs_transactions_history.transactions
- Create a database called dbs_transactions_history.error_log
  
**3. Set up local environment**
- Pull from this github repo: https://github.com/eugenetan01/DBS_ACID_POV.git

**4. Set up App services environment** 
- Realm-cli push the realm project “DBS” into a new app services project on your atlas project
- You should see a HTTPS endpoint configured, with a function called transfer attached to it. 
- This HTTP endpoint will be the API endpoint to run an ACID transaction on MongoDB to deduct and deposit funds from the savings account to the current account, and log each activity as an individual transaction in the transactions database

**2. Load data into Collection In The Atlas Cluster**
- Run sample command to load data into atlas cluster from the account.json in git repo
- Load 10 documents with balance = 100 into savings dbs_payer.payer 
  ```mgeneratejs account.json -n 10 | mongoimport --uri "mongodb+srv://sa:admin@dbs.qv1it.mongodb.net/dbs_payer?retryWrites=true&w=majority" --collection accounts```
- Load another 10 documents where balance = 0 (change the account.json number from 100 to 0 in the balance field)
  ```mgeneratejs account.json -n 10 | mongoimport --uri "mongodb+srv://sa:admin@dbs.qv1it.mongodb.net/dbs_payee?retryWrites=true&w=majority" --collection accounts```
