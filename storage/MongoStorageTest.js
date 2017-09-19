"use strict";

if (!process.env.MONGOSTORE_TEST_HOST)
{
  process.exit(0);
}

const storageTester = require('./storageTester');
const Storage = require('./MongoStorage');

storageTester(Storage, {
  connectionString: process.env.MONGOSTORE_TEST_HOST
});
