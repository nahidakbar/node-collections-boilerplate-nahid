"use strict";

const AWS = require('aws-sdk');
const Storage = require('./Storage');

const dynamoDecodeRecord = require('./dynamoDecodeRecord');
const dynamoEncodeRecord = require('./dynamoEncodeRecord');
const StreamsNotifier = require('./DynamoStorageStreamNotifier');

/**
 * Use a AWS DynamoDB table as storage.
 *
 * Pretty pointless storage system but have some legacy data in it.
 *
 * Needs ```aws-sdk``` package.
 */
class DynamoStorage extends Storage
{
  /**
   * @param {StorageOptions} options see fields
   */
  constructor(options = {})
  {
    super(options)
    /** AWS region */
    this.region = options.region || undefined;
    /** reference to driver object */
    this.db = new AWS.DynamoDB({
      apiVersion: '2012-08-10',
      maxRetries: 99 * 1024,
      endpoint: this.connectionString ? new AWS.Endpoint(this.connectionString) : undefined,
      region: this.region
    });

    /**
     * Set it to true to use streams for receiving data updates.
     * @type {boolean}
     */
    this.useStreams = options.useStreams || false;
    if (this.useStreams)
    {
      /** @private */
      this.notifier = new StreamsNotifier(this);
      /** @private */
      this.updateCheckImpl = this.notifier.updateCheck.bind(this.notifier);
    }
  }

  async connect()
  {
    if (this.notifier)
    {
      await this.notifier.connect();
    }
    await super.connect();
  }

  /** @override */
  readAllRecords()
  {
    const that = this;
    return new Promise((resolve, reject) =>
    {
      let items = [];

      function scan(LastEvaluatedKey = undefined)
      {
        const request = {
          TableName: that.collectionName,
        }
        if (LastEvaluatedKey)
        {
          request.ExclusiveStartKey = LastEvaluatedKey;
        }

        that.db.scan(request, (err, data) =>
        {
          if (err)
          {
            reject(err);
          }
          else
          {
            items = items.concat(data.Items)
            if (data.LastEvaluatedKey)
            {
              scan(data.LastEvaluatedKey);
            }
            else
            {
              items = items.map(record =>
              {
                return dynamoDecodeRecord(record, that.primaryKey);
              });
              resolve(items);
            }
          }
        });
      }
      scan();
    });
  }

  /** @override */
  createRecord(record)
  {
    return this.updateRecord(record);
  }

  /** @override */
  async readRecord(record)
  {
    const query = {
      TableName: this.collectionName,
      Key: {}
    };
    query.Key[this.primaryKey] = {
      "S": record[this.primaryKey]
    };
    let data = await this.db.getItem(query)
      .promise();

    data = data.Item;
    // if (!data)
    // {
    //   throw new Error('not found');
    // }
    return dynamoDecodeRecord(data, this.primaryKey);
  }

  /** @override */
  async updateRecord(record)
  {
    await this.db.putItem({
        TableName: this.collectionName,
        Item: dynamoEncodeRecord(record, this.primaryKey)
      })
      .promise();
    return record;
  }

  /** @override */
  async deleteRecord(record)
  {
    const query = {
      TableName: this.collectionName,
      Key: {}
    };
    query.Key[this.primaryKey] = {
      "S": record[this.primaryKey]
    };
    return await this.db.deleteItem(query)
      .promise();
  }
}

module.exports = DynamoStorage;
