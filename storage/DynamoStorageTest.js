"use strict";

if (!process.env.DYNAMOSTORE_TEST_HOST)
{
  process.exit(0);
}

if (!process.env.DYNAMOSTORE_TEST_REGION)
{
  process.exit(0);
}


const storageTester = require('./storageTester');
const Storage = require('./DynamoStorage');

storageTester(Storage, {
  region: process.env.DYNAMOSTORE_TEST_REGION,
  connectionString: process.env.DYNAMOSTORE_TEST_HOST
});
