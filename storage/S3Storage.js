"use strict";

const AWS = require('aws-sdk');
const Storage = require('./Storage');

/**
 * Use a AWS S3 bucket as storage.
 * 
 * Requires ```aws-sdk``` package.
 */
class S3Storage extends Storage
{
  /**
   * @param {StorageOptions} options see fields
   */
  constructor(options)
  {
    super(options)
    /** AWS region */
    this.region = options.region;
    /** reference to driver object */
    this.s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      endpoint: this.connectionString,
      region: this.region,
      s3ForcePathStyle: true
    });
  }

  /** @override */
  connect()
  {
    return new Promise((resolve, reject) =>
    {
      this.listItems()
        .then(list => resolve(this.list = list), reject);
    });
  }

  /** s3 list gives us last modified date; use that to efficiently check for updates */
  listItems()
  {
    const that = this;
    return new Promise((resolve, reject) =>
    {
      let output = {};

      function iterate(ContinuationToken)
      {
        that.s3.listObjectsV2({
          Bucket: that.collectionName,
          ContinuationToken
        }, (err, data) =>
        {
          if (err)
          {
            return reject(err);
          }

          data.Contents.forEach(item =>
          {
            output[item.Key] = item.LastModified;
          });

          if (!data.IsTruncated)
          {
            resolve(output);
          }
          else
          {
            iterate(data.NextContinuationToken);
          }
        });
      }
      iterate();
    });
  }

  /** @override */
  readAllRecords()
  {
    return new Promise((resolve, reject) =>
    {
      Promise.all(Object.keys(this.list)
          .map(item =>
          {
            let query = {};
            query[this.primaryKey] = item;
            return this.readRecord(query);
          }))
        .then(resolve, reject);
    });
  }

  /** @override */
  createRecord(record)
  {
    return this.updateRecord(record);
  }

  /** @override */
  readRecord(record)
  {
    return new Promise((resolve, reject) =>
    {
      this.s3.getObject({
        Bucket: this.collectionName,
        Key: record[this.primaryKey]
      }, (err, data) =>
      {
        if (err)
        {
          reject(err);
        }
        else
        {
          this.list[record[this.primaryKey]] = data.LastModified;
          resolve(JSON.parse(data.Body));
        }
      });
    });
  }

  /** @override */
  updateRecord(record)
  {
    return new Promise((resolve, reject) =>
    {
      this.s3.upload({
        Bucket: this.collectionName,
        Key: record[this.primaryKey],
        Body: JSON.stringify(record)
      }, (err, data) =>
      {
        if (err)
        {
          reject(err);
        }
        else
        {
          resolve(this.readRecord(record));
        }
      });
    });
  }

  /** @override */
  deleteRecord(record)
  {
    return new Promise((resolve, reject) =>
    {
      this.s3.deleteObject({
        Bucket: this.collectionName,
        Key: record[this.primaryKey]
      }, (err, data) =>
      {
        if (err)
        {
          reject(err);
        }
        else
        {
          resolve(record);
        }
      });
    });
  }

  /** @override */
  async updateCheckImpl()
  {
    let updated = false;
    let newlist = await this.listItems();
    let list = this.list,
      record = {};

    // check for deleted item
    for (let item in list)
    {
      if (!newlist[item])
      {
        record[this.primaryKey] = item;
        this.emit('delete', record);
        delete list[item];
        updated = true;
      }
    }

    // check for new items
    for (let item in newlist)
    {
      if (!list[item])
      {
        record[this.primaryKey] = item;
        this.readRecord(Object.assign({}, record))
          .then(record =>
          {
            this.emit('create', record);
            updated = true;
          }, x => x);
        list[item] = newlist[item];
      }
    }

    // check for modified items
    for (let item in list)
    {
      if (list[item].getTime() !== newlist[item].getTime())
      {
        record[this.primaryKey] = item;
        this.readRecord(Object.assign({}, record))
          .then(record =>
          {
            this.emit('update', record);
            updated = true;
          }, x => x);
        list[item] = newlist[item];
      }
    }
    return updated;
  }
}

module.exports = S3Storage;
