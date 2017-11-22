"use strict";

var AWS = require('aws-sdk-mock');

// set up a mock service
const buckets = {};
const streams = {};
const SHARD_LIMIT = 100;

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
  const oldTable = buckets[params.TableName];
  const newTable = buckets[params.TableName] = (buckets[params.TableName] || []).filter(item => item.id.S != params.Item.id.S);
  let event = (oldTable || []).length !== newTable.length? 'MODIFY' : 'INSERT';
  newTable.push(JSON.parse(JSON.stringify(params.Item)))
  callback(null, 'done');
  logEvent(params.TableName, event, params.Item);
});

AWS.mock('DynamoDB', 'deleteItem', function (params, callback) {
  buckets[params.TableName] = (buckets[params.TableName] || []).filter(item => item.id.S != params.Key.id.S);
  callback(null, 'done');
  logEvent(params.TableName, 'REMOVE', params.Key);
});

AWS.mock('DynamoDBStreams', 'listStreams', function (params, callback)
{
if (params.TableName)
{
  streams[params.TableName] = streams[params.TableName] || [[]];
}
callback(null, {
  Streams: Object.keys(streams).map(stream =>
    {
      return {
        StreamArn: 'arn:' + stream,
        TableName: stream
      };
    })
  });
});

AWS.mock('DynamoDBStreams', 'describeStream', function (params, callback) {
  //console.log('DynamoDBStreams::describeStream', params)
  const stream = params.StreamArn.split(':')[1];
  const shardOffset = params.ExclusiveStartShardId? parseInt(params.ExclusiveStartShardId.split(':')[2]) + 1 : 0;
  callback(null, {
    StreamDescription: {
      Shards: streams[stream].map((shard, shardIndex) => {
        return {
          ShardId: `shard:${stream}:${shardIndex}`
        };
      }).slice(shardOffset)
    }
  });
});

AWS.mock('DynamoDBStreams', 'getShardIterator', function (params, callback) {
  const stream = params.ShardId.split(':')[1];
  const shard = parseInt(params.ShardId.split(':')[2]);
  switch (params.ShardIteratorType) {
    case 'LATEST':
    callback(null, {
      ShardIterator: `shardIterator:${stream}:${shard}:${streams[stream][shard].length}`
    })
    break;
    case 'TRIM_HORIZON':
    callback(null, {
      ShardIterator: `shardIterator:${stream}:${shard}:0`
    })
    break;
    default:
    console.log('DynamoDBStreams::getShardIterator', params)
  }
});

AWS.mock('DynamoDBStreams', 'getRecords', function (params, callback) {
  // console.log('DynamoDBStreams::getRecords', params)
  const stream = params.ShardIterator.split(':')[1];
  const shard = parseInt(params.ShardIterator.split(':')[2]);
  const index = parseInt(params.ShardIterator.split(':')[3]);
  let data = streams[stream][shard];
  const NextShardIterator = (data.length >= SHARD_LIMIT) ? null : `shardIterator:${stream}:${shard}:${data.length}`;
  const Records = data.slice(index);
  callback(null, {
    NextShardIterator,
    Records
  })
});

function logEvent(table, event, record)
{
  streams[table] = streams[table] || [[]];
  const shards = streams[table];
  let lastShard = shards[shards.length - 1];
  lastShard.push({
    eventName: event,
    dynamodb: {
      Keys: record,
      NewImage: record
    }
  })
  if (lastShard.length >= SHARD_LIMIT)
  {
    shards.push([]);
  }
  // console.log('LOG', event, record)
}

const storageTester = require('./storageTester');
const Storage = require('./DynamoStorage');

storageTester(Storage, {
  region: 'test',
  connectionString: 'test'
});

storageTester(Storage, {
  region: 'test',
  connectionString: 'test',
  useStreams: true
});
