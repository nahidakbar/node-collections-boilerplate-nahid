"use strict";

if (!process.env.ELASTICSEARCH_TEST_HOST)
{
  process.exit(0);
}

const Class = require('./ElasticSearch');
const searchTester = require('./searchTester');

searchTester(Class, {
  connectionString: process.env.ELASTICSEARCH_TEST_HOST
});
