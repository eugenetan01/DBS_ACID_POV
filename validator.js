db.runCommand({
  collMod: "savings",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      properties: {
        balance: {
          bsonType: "decimal", // Assuming it's stored as a string
          minimum: 0,
        },
      },
    },
  },
  validationLevel: "strict",
});

// use the below only to remove validation (if needed)
db.runCommand({
  collMod: "current",
  validator: {},
  validationLevel: "off",
});
