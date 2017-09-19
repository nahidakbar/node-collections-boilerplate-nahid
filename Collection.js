"use strict";

/**
 * Should be the class that programs interact with.
 * 
 * It should take care of syncing data between storage and search.
 */
class Collection
{

  /**
   * @param {object} options; see public fields for details
   */
  constructor(options)
  {
    /**
     * where data is stored
     * @type {Storage}
     */
    this.storage = options.storage;
    /**
     * instance of Search
     * @type {Search}
     */
    this.search = options.search;
    /**
     * name of collection
     * @type {?string}
     */
    this.collectionName = options.collectionName || options.storage.collectionName || 'unspecified'; // optional
    /**
     * id field of records
     * @type {string}
     */
    this.primaryKey = options.primaryKey || 'id';
    /**
     * search definition
     * @type {SearchMeta}
     */
    this.searchMeta = options.searchMeta || {};
  }

  /**
   * Call this to connect to storage units and search
   */
  async initialise()
  {
    await this.storage.connect();
    const records = await this.storage.readAllRecords();
    await this.search.initialise(this.searchMeta, records);
    return records;
  }

  /**
   * Helper creation method
   */
  static create(storage, search, Class)
  {
    return new Promise((resolve, reject) =>
    {
      let pimaryKey = Class.pimaryKey;
      let searchMeta = Class.searchMeta;
      let collection = new Class({
        storage,
        search,
        pimaryKey,
        searchMeta
      });
      collection.initialise()
        .then(() => resolve(collection), reject);
    });
  }

  /**
   * Add a new record to collection.
   */
  async createRecord(record)
  {
    record = await this.storage.createRecord(record);
    console.log('CREATED', this.collectionName, record[this.primaryKey]);
    await this.search.createRecord(record);
    return record;
  }

  /**
   * Read an existing record.
   */
  readRecord(record)
  {
    return this.storage.readRecord(record);
  }

  /**
   * Update an existing record.
   */
  async updateRecord(record)
  {
    record = await this.storage.updateRecord(record);
    console.log('UPDATED', this.collectionName, record[this.primaryKey]);
    await this.search.updateRecord(record);
    return record;
  }

  /**
   * Update field of a record.
   * 
   * Override this to inject custom processing rules.
   */
  updateField(record, field, value)
  {
    record[field] = value;
  }

  /**
   * Delete a record from collection
   */
  async deleteRecord(record)
  {
    record = await this.storage.deleteRecord(record);
    console.log('DELETED', this.collectionName, record[this.primaryKey]);
    await this.search.deleteRecord(record);
    return record
  }

  /**
   * Search for records in collection using query.
   */
  async searchRecords(query)
  {
    let offset = query.offset;
    delete query.offset;
    let limit = query.limit;
    delete query.limit;
    let records = await this.search.searchRecords(query);
    let results = {
      results: records,
      total: records.length,
      offset: offset,
    };
    if (query.sort)
    {
      results.sort = query.sort;
      results.order = query.order;
    }
    records = records.splice(offset, limit);
    records = records.map(id =>
    {
      const query = {};
      query[this.primaryKey] = id;
      return this.readRecord(query);
    });
    records = await Promise.all(records);
    return {
      results: records.map(x => this.stripRecord(x, query.extra))
    };
  }

  /**
   * Strips a record to return as search result.
   */
  stripRecord(record, extra = [])
  {
    let out = {};
    out[this.primaryKey] = record[this.primaryKey];
    for (let field in this.searchMeta.fields)
    {
      let value = record[field];
      if (value !== undefined)
      {
        out[field] = value;
      }
    }
    for (let field of extra)
    {
      let value = record[field];
      if (value !== undefined)
      {
        out[field] = value;
      }
    }
    return out;
  }
}

module.exports = Collection;
