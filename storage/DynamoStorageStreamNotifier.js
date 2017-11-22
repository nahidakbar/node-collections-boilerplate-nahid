const AWS = require('aws-sdk');

const dynamoDecodeRecord = require('./dynamoDecodeRecord');

/**
 * Implmentation of streams notification handler.
 *
 * Do not use directly. see useStreams option in DynamodbStorage.
 */
class DynamoStorageStreamNotifier
{
  constructor(storage)
  {
    this.storage = storage;
    this.stream = new AWS.DynamoDBStreams({
      apiVersion: '2012-08-10',
      region: storage.region
    });
  }

  async connect()
  {
    // extract StreamArn with ListStreams
    const streams = (await this.stream.listStreams({
      TableName: this.storage.collectionName
    }).promise()).Streams || [];
    if (streams.length === 0)
    {
      throw new Error(`Stream is not found for table '${this.storage.collectionName}'.`);
    }
    this.streamArn = streams[0].StreamArn;

    // find the latest shard id
    let lastEvaluatedShardId = undefined;
    let stream;
    do {
      stream = (await this.stream.describeStream({
        StreamArn: this.streamArn,
        ExclusiveStartShardId: lastEvaluatedShardId
      }).promise()).StreamDescription;
      lastEvaluatedShardId = stream.LastEvaluatedShardId;
    } while (stream.LastEvaluatedShardId);
    let shards = stream.Shards;
    let shard = shards[shards.length - 1];
    this.shardId = shard.ShardId;

    // find the latest shard iterator
    let iterator = await this.stream.getShardIterator({
      StreamArn: this.streamArn,
      ShardId: this.shardId,
      ShardIteratorType: 'LATEST'
      //ShardIteratorType: 'TRIM_HORIZON'
    }).promise();
    this.shardIterator = iterator.ShardIterator;
  }

  async updateCheck()
  {
    if (!this.shardIterator)
    {
      // get next shard iterator
      const shards = (await this.stream.describeStream({
        StreamArn: this.streamArn,
        ExclusiveStartShardId: this.shardId
      }).promise()).StreamDescription.Shards;
      if (shards.length > 0)
      {
        this.shardId = shards[0].ShardId;
        this.shardIterator = (await this.stream.getShardIterator({
          StreamArn: this.streamArn,
          ShardId: this.shardId,
          ShardIteratorType: 'TRIM_HORIZON'
        }).promise()).ShardIterator;
      }
      else
      {
        return;
      }
    }
    const records = await this.stream.getRecords({
      ShardIterator: this.shardIterator
    }).promise();
    for (let record of records.Records)
    {
      switch (record.eventName) {
        case 'INSERT':
          this.storage.emit('create', dynamoDecodeRecord(record.dynamodb.NewImage, this.storage.primaryKey));
          break;
        case 'MODIFY':
          this.storage.emit('update', dynamoDecodeRecord(record.dynamodb.NewImage, this.storage.primaryKey));
          break;
        case 'REMOVE':
          this.storage.emit('delete', dynamoDecodeRecord(record.dynamodb.Keys, this.storage.primaryKey));
          break;
        default:
          console.log('[ERROR] TODO: process', record);
      }
    }
    this.shardIterator = records.NextShardIterator;
    if (records.Records.length > 0)
    {
      await this.updateCheck();
    }
  }
}

module.exports = DynamoStorageStreamNotifier;

/*
(async function()
{
  const notifier = new Notifier({
    region: 'ap-southeast-2',
    collectionName: 'test2',
    primaryKey: 'id',
    emit: console.log.bind(console)
  });
  await notifier.initialise();

  async function checkForUpdate()
  {
    await notifier.checkForUpdate();
    setTimeout(checkForUpdate, 1000)
  }

  checkForUpdate()

})();
*/
