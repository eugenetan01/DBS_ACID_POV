#!/usr/bin/env python

########################################################################
#
# This is the absolute, simplest Locust example that exists.
# All it does is demonstrate is how to create a Locust task
# and utilize the 'Host' parameter in the Locust UI
# to dynamically pass in variables to the script
# so you don't need to hardcode any sensitive logic
# and offers reusability for future projects.
#
# ANYTHING THAT REQUIRES YOUR ATTENTION WILL HAVE A TODO IN THE COMMENTS
# Do not create external files outside of this locust file.
# mLocust only allows you to upload a single python file atm.
#
########################################################################

# Allows us to make many pymongo requests in parallel to overcome the single threaded problem
import gevent

_ = gevent.monkey.patch_all()

########################################################################
# TODO Add any additional imports here.
# TODO Make sure to include in requirements.txt, if necessary.
########################################################################
import pymongo
from bson import json_util
from bson.json_util import loads
from bson import ObjectId
from locust import User, events, task, constant, tag, between
import time
import requests
import random
import json

# Global vars
# Store the client conn globally so we don't create a conn pool for every user
# Track the srv globally so we know if we need to reinit the client
_CLIENT = None
_SRV = None


class MetricsLocust(User):
    ########################################################################
    # Class variables.
    # The values are initialized with None till they get set
    # from the actual locust exeuction when the 'Host' param is passed in.
    ########################################################################
    client, coll = None, None

    ####################################################################
    # You can throttle tasks being executed by each simulated user
    # Only do this if the client really wants to simulate n-number
    # of users. Otherwise, if you leave this commented out,
    # the performance will increase by 400%
    ####################################################################
    # wait_time = between(1, 1)

    ####################################################################
    # Initialize any env vars from the Host parameter
    # Set the target collections and such here
    ####################################################################
    def __init__(self, parent):
        global _CLIENT, _SRV

        super().__init__(parent)

        try:
            # Parse out env variables from the host
            vars = self.host.split("|")
            print("Host Param:", self.host)
            srv = vars[0]
            if _SRV != srv:
                self.client = pymongo.MongoClient(srv)
                _CLIENT = self.client
                _SRV = srv
            else:
                self.client = _CLIENT

            db = self.client[vars[1]]
            self.coll = db[vars[2]]
        except Exception as e:
            # If an exception is caught, Locust will show a task with the error msg in the UI for ease
            events.request.fire(
                request_type="Host Init Failure",
                name=str(e),
                response_time=0,
                response_length=0,
                exception=e,
            )
            raise e

    ################################################################
    # Example helper function that is not a Locust task.
    # All Locust tasks require the @task annotation
    # TODO Create any additional helper functions here
    ################################################################
    def get_time(self):
        return time.time()

    ################################################################
    # Start defining tasks and assign a weight to it.
    # All tasks need the @task() notation.
    # Weights indicate the chance to execute, e.g. 1=1x, 5=5x, etc.
    # In locustfile-mimesis.py, the task weights
    # have been parameterized too and dynamically passed in via Host
    # TODO Create any additional task functions here
    ################################################################
    @task(1)
    def _async_find(self):
        # Note that you don't pass in self despite the signature above
        tic = self.get_time()
        name = "findOne"

        try:
            # Get the record from the target collection now
            newClient = pymongo.MongoClient(
                "mongodb+srv://sa:admin@dbs.qv1it.mongodb.net/?retryWrites=true&w=majority"
            )

            db_payer = newClient.dbs_payer  # Use your database name
            collection_payer = db_payer.accounts

            db_payee = newClient.dbs_payee  # Use your database name
            collection_payee = db_payee.accounts

            payer = collection_payer.find({}, {"_id": 0, "account_id": 1})[
                random.randint(0, 99)
            ]
            payee = collection_payee.find({}, {"_id": 0, "account_id": 1})[
                random.randint(0, 99)
            ]

            amount = 10

            body = {"payer": payer, "payee": payee, "amount": amount}

            body = {
                "payer": payer["account_id"],
                "payee": payee["account_id"],
                "amount": amount,
            }
            json_data = json.dumps(body)

            response = requests.post(
                "https://ap-southeast-1.aws.data.mongodb-api.com/app/dbs-gpnie/endpoint/casa/transfer",
                data=json_data,
            )

            events.request.fire(
                request_type="mlocust",
                name=name,
                response_time=(self.get_time() - tic) * 1000,
                response_length=0,
            )
        except Exception as e:
            events.request.fire(
                request_type="mlocust",
                name=name,
                response_time=(self.get_time() - tic) * 1000,
                response_length=0,
                exception=e,
            )
            # Add a sleep so we don't overload the system with exceptions
            time.sleep(5)


2978571500
7175354169, 8931131847
