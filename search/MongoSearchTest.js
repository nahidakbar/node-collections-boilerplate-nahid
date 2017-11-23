"use strict";

if (process.env.MONGOSEARCH_TEST_HOST)
{

  const Class = require('./MongoSearch');
  const searchTester = require('./searchTester');

  searchTester(Class, {
    connectionString: process.env.MONGOSEARCH_TEST_HOST
  });

}
