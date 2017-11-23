"use strict";

if (process.env.ELASTICSEARCH_TEST_HOST)
{

  const Class = require('./ElasticSearch');
  const searchTester = require('./searchTester');

  searchTester(Class, {
    connectionString: process.env.ELASTICSEARCH_TEST_HOST
  });

}
