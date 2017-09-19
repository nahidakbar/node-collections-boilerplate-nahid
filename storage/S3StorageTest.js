"use strict";

if (!process.env.S3STORE_TEST_HOST)
{
  process.exit(0);
}

if (!process.env.S3STORE_TEST_REGION)
{
  process.exit(0);
}

const storageTester = require('./storageTester');
const Storage = require('./S3Storage');

storageTester(Storage, {
  region: process.env.S3STORE_TEST_REGION,
  connectionString: process.env.S3STORE_TEST_HOST
});
