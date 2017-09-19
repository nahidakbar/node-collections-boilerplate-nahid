"use strict";

var AWS = require('aws-sdk-mock');

// set up a mock service
const buckets = {};

AWS.mock('DynamoDB', 'scan', function (params, callback) {
  const Items = JSON.parse(JSON.stringify(buckets[params.TableName] || []));
  callback(null, {Items});
});

AWS.mock('DynamoDB', 'getItem', function (params, callback) {
  let Item = (buckets[params.TableName] || []).filter(item => item.id.S === params.Key.id.S);
  
  if (Item.length)
  {
    Item = Item[0];
    callback(null, JSON.parse(JSON.stringify({Item})));  
  }
  else
  {
    callback(new Error('not found'), null);
  }
  
});

AWS.mock('DynamoDB', 'putItem', function (params, callback) {
  buckets[params.TableName] = (buckets[params.TableName] || []).filter(item => item.id.S != params.Item.id.S);
  buckets[params.TableName].push(JSON.parse(JSON.stringify(params.Item)))
  callback(null, 'done');
});

AWS.mock('DynamoDB', 'deleteItem', function (params, callback) {
  buckets[params.TableName] = (buckets[params.TableName] || []).filter(item => item.id.S != params.Key.id.S);
  callback(null, 'done');
});

const storageTester = require('./storageTester');
const Storage = require('./DynamoStorage');

storageTester(Storage, {
  region: 'test',
  connectionString: 'test'
});
