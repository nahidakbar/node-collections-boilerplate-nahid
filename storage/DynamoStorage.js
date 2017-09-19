"use strict";

const AWS = require('aws-sdk');
const Storage = require('./Storage');

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
                for (let key in record)
                {
                  let value = record[key].S;
                  if (key === that.primaryKey)
                  {
                    record[key] = value;
                  }
                  else
                  {
                    record[key] = JSON.parse(value);
                  }
                }
                return record;
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
    if (!data)
    {
      throw new Error('not found');
    }
    for (let key in data)
    {
      let value = data[key].S;
      if (key === this.primaryKey)
      {
        data[key] = value;
      }
      else
      {
        data[key] = JSON.parse(value);
      }
    }
    return data;
  }

  /** @override */
  async updateRecord(record)
  {
    let that = this;
    let update = {};
    for (let key in record)
    {
      let value = record[key];
      if (key === that.primaryKey)
      {
        update[key] = {
          "S": value
        };
      }
      else
      {
        update[key] = {
          "S": JSON.stringify(value)
        };
      }
    }
    await this.db.putItem({
        TableName: this.collectionName,
        Item: update
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
