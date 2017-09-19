"use strict";

const mongodb = require('mongodb');
const Storage = require('./Storage');

const MONGO_BULK_RECORDS_GET_COUNT = 1024;

/**
 * Mongodb collection as storage.
 * 
 * Requires ```mongodb``` package.
 */
class MongoStorage extends Storage
{
  /** @override */
  connect()
  {
    return new Promise((resolve, reject) =>
    {
      mongodb.MongoClient.connect(this.connectionString, (err, db) =>
      {
        if (err)
        {
          reject(err);
        }
        else
        {
          /**
           * reference to driver database object
           */
          this.database = db;
          /**
           * reference to driver collection object
           */
          this.collection = db.collection(this.collectionName);
          resolve();
          let index = {};
          index[this.primaryKey] = 1;
          this.collection.createIndex(index);
        }
      });
    });
  }

  /** @override */
  async readAllRecords()
  {
    let collection = this.collection;
    const count = await collection.count({}, {});
    let records = [];
    while (records.length < count)
    {
      const items = await
      collection.find({})
        .skip(records.length)
        .limit(MONGO_BULK_RECORDS_GET_COUNT)
        .toArray();
      items.forEach(item => delete item._id);
      records = records.concat(items);
    }
    return records;
  }

  /** @override */
  async createRecord(record)
  {
    let collection = this.collection;
    await collection.insertOne(record, {});
    return await this.readRecord({
      _id: record._id
    });
  }

  /** @override */
  async readRecord(record)
  {
    let collection = this.collection;
    const found = await collection.findOne(record, {});
    if (!found)
    {
      throw new Error('Not found.');
    }
    delete found._id;
    return found;
  }

  /** @override */
  updateRecord(record)
  {
    let collection = this.collection;
    return new Promise((resolve, reject) =>
    {
      let query = {};
      query[this.primaryKey] = record[this.primaryKey];
      collection.updateOne(query, record, {}, (err, result) =>
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
  deleteRecord(record)
  {
    let collection = this.collection;
    return new Promise((resolve, reject) =>
    {
      let query = {};
      query[this.primaryKey] = record[this.primaryKey];
      collection.deleteOne(query, {}, (err, result) =>
      {
        if (err || result.deletedCount === 0)
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

}

module.exports = MongoStorage;
