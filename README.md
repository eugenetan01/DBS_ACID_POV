# MONGODB ACID TRANSACTIONS

**Ability to achieve ACID transactions with MongoDB**

**SA Maintainer**: [Eugene Tan](mailto:eugene.tan@mongodb.com) <br/>
**Time to setup**: 10 mins <br/>
**Time to execute**: 15 mins <br/>

---

## Description

This proof shows how you can achieve MongoDB ACID transactions with the Core transaction and Callback transaction API

For this proof, an Atlas cluster will be loaded with [sample data](https://docs.atlas.mongodb.com/sample-data/). The **payers** and **payees** collection will reside individually in its own databases, and we will simulate transferring money from payers to payees. There will also be a Transactions History database to capture all successful transactions and errors.

This proof shows that you can achieve ACID guarantees on a transaction, and how errors are handled and transactions are rolled back during such events.

To do so we will be running 2 scenarios. 

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

**5. Load data into Collection In The Atlas Cluster**
- Run sample command to load data into atlas cluster from the account.json in git repo
- Load 10 documents with balance = 100 into savings dbs_payer.payer <br />
  ```mgeneratejs account.json -n 10 | mongoimport --uri "mongodb+srv://sa:admin@dbs.qv1it.mongodb.net/dbs_payer?retryWrites=true&w=majority" --collection accounts```
- Load another 10 documents where balance = 0 (change the account.json number from 100 to 0 in the balance field)  <br />
  ```mgeneratejs account.json -n 10 | mongoimport --uri "mongodb+srv://sa:admin@dbs.qv1it.mongodb.net/dbs_payee?retryWrites=true&w=majority" --collection accounts```

---

## Execution for scenario 1

**1. Go to the payer collection first, show that each record is $100**

**2. Show the payee collection, show that each record  record is $0**

**3. Run scenario1_base.py script to show the current value of both the payer and payee account selected as an infinite loop**

- The program will exit when a change in value is detected
  
**4. Copy the scenario1.acid.js line by line into mongosh to show each output and value only changes and visible to session2 once session1 is committed**

---

## Measurement for scenario 1

**1. Once the changes are committed, the scenario1_base.py should stop running and show that the balance in payer and payee has changed**

---

## Description of scenario 2

** Architecture for scenario 2 **

![Architecture](img/architecture.jpg)

- Transfer API: Hosted on MongoDB Atlas App services that controls the ACID transaction block logic using the Callback API

- App.js: Hosted locally to fire async calls to Transfer APIs

- MongoDB: Database that stores all payers, payees, error_logs and successful transaction operations

** Client App Logic **

![App Logic](img/app_logic.png)

- Iterating over each payer and debiting $10 to each payee

- Runtime is O(n^2)

- This for loop will run async without waiting for the previous transfer call to be successful, simulating high concurrency on a limited set of users

- There is a sleep timer on Line 51 of scenario_2/app.js, adjust to increase or reduce the concurrency to better simulate a controllable amount of errors for demo purposes

---

## Execution for scenario 2

**1. Reset the payer back to 100 and payee back to 0 by running the commands in command.txt in the root directory**

**2. Navigate to scenario2 folder to run scenario 2 where there are multiple concurrent API calls to the Transfer API - we want to simulate write conflicts and failure scenarios**

- Show the Transfer API in your App services project and walk through the logic as per the comments 
  
- Run the printBalance.js script - shows all payers are 100 in balance in payees are 0 in balance

- Show the payers and payees collection

- Run the printError.js - shows that no errors in the error log

- Show the error collection

- Show the realm function and explain what it does

- Show the transactions collection where records are stored there if successful

**3. Review the app.js script and show that the code is trying to:**

- pay $10 each from each payer to each payee concurrently without waiting for promises to be returned

- pay $120 at the end to cause balance to be less than $100 - fulfilling the error condition on the Transfer API

**4. Run the app.js script once first to ensure all cold starts on Atlas App Services HTTPs API is cleared**

**5. Run the commands in commands.txt in the root directory to reset the db to original clean state**

**6. Run the app.js script again**

---

## Measurement for scenario 2

**1. See the printBalance script balance falling for each payer and each payee's balance increasing**

**2. See the printError script showing errors logged in the console that is being read from the error_log collection**

**3. Navigate to the errors_log collection in MongoDB Compass**

**4. Show the custom error validation where "Balance of payer is less than 0" and check that:**

- payer account_id = 1 still has a balance of above 0

- payee account_id = 1 does not have a balance of more than $0

- This shows that the transaction rolled back and failed when the custom error was thrown.  

**5. Go to the error log collection and look for the documents with write conflict**

**6. Pick a record with "WriteConflict" error and check:**

- what was the balance of this user in payerBefore (i.e. 100)

- what was the timestamp captured when the error failed (i.e. 10:44:37.789)

- what was the payerBefore.account_id (i.e. id = 1)

- Note how many failures there were for this record where payerBefore.account_id = 1 (i.e. 2)

**7. Go to the transactions collection and search for the same payerBefore account_id captured in the error_log record and you should see if there 2 errors, there should be 8 transactions successful.**

**6. Go to the record where the balance of the same payerBefore.account_id record is the same as the balance in the error_log record that was noted above**

- (i.e. payerBeforeaccount_id = 1, payerBefore.balance: 100)

- This shows that this was the conflicting transaction that caused the transaction in the error log to experience a write conflict and fail, because the payer's balance of the transaction in the error collection was changed by this transaction in the middle of runtime. 

**9. Check at what time did the transaction get logged successfully. You should see the successful transaction timestamp was before the error timestamp, causing the other transaction to fail and experience a write conflict** 

