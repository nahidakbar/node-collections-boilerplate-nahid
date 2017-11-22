"use strict";

const EventEmitter = require('events');

const ONE_MINUTE_MS = 60 * 1000
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const ONE_PERCENT_RATIO = 1.01;

/**
 * @abstract
 * @public
 */
class Storage extends EventEmitter
{
  /**
   * @param {StorageOptions} options see fields
   */
  constructor(options)
  {
    super();

    /**
     * id field of record
     */
    this.primaryKey = options.primaryKey || 'id';
    /**
     * Connection string for storage. e.g. for FSStorage, it is a path
     */
    this.connectionString = options.connectionString || '';
    /**
     * Name of collection. Derived from connection string if there is # based seperation.
     */
    this.collectionName = this.connectionString.substr(this.connectionString.indexOf('#') + 1);
    this.connectionString = this.connectionString.substr(0, this.connectionString.indexOf('#'));
    if (!this.connectionString)
    {
      delete this.connectionString;
    }
    /**
     * Minimum duration between updates in ms
     * @type {number}
     */
    this.updateInterval = options.updateInterval || ONE_MINUTE_MS;
    /**
     * Maximum duration between updates in ms
     * @type {number}
     */
    this.updateIntervalMax = options.updateIntervalMax || FIFTEEN_MINUTES_MS;
    /**
     * Rate at which update checks are slowed down when there are no updates.
     * @type {number}
     */
    this.updateIntervalSlowdownRate = options.updateIntervalSlowdownRate || ONE_PERCENT_RATIO;
  }

  /**
   * Connect to data storage
   */
  async connect()
  {

  }

  /**
   * @return {Array<Record>}
   * @abstract
   */
  async readAllRecords()
  {
    throw new Error('TODO: not immplemented');
  }

  /**
   * @abstract
   */
  async createRecord(record)
  {
    throw new Error('TODO: not immplemented');
  }

  /**
   * @abstract
   */
  async readRecord(record)
  {
    throw new Error('TODO: not immplemented');
  }

  /**
   * @abstract
   */
  async updateRecord(record)
  {
    throw new Error('TODO: not immplemented');
  }

  /**
   * @abstract
   */
  async deleteRecord(record)
  {
    throw new Error('TODO: not immplemented');
  }

  /**
   * Start checking for updates.
   * Emit events when there are updates.
   * Required for use with CachedCollection
   */
  startRecordUpdateCheck()
  {
    let currentTimeout = this.updateInterval;
    async function checkUpdate()
    {
      /**
       * update check timeout object
       */
      this.timeout = undefined;
      let updated = false;
      try
      {
        updated = await this.updateCheckImpl();
      }
      catch (e)
      {
        console.error(e);
      }
      if (updated || !this.updateIntervalSlowdownRate)
      {
        currentTimeout = this.updateInterval;
      }
      else
      {
        currentTimeout = Math.min(currentTimeout * this.updateIntervalSlowdownRate, this.updateIntervalMax);
      }
      this.timeout = setTimeout(checkUpdate.bind(this), currentTimeout).unref();
    }
    this.timeout = setTimeout(checkUpdate.bind(this), currentTimeout).unref();
  }

  /**
   * Implmentation of update checking.
   *
   * Override this if storage has more efficient way of checking for updates.
   *
   * @abstract
   */
  async updateCheckImpl()
  {
    if (!this.bruteForceNotified)
    {
      console.log('WARNING: UPDATE IS NOT NATIVELY SUPPORTED BY STORAGE; USING BRUTE FORCE UPDATE. THIS MAY BE SLOWER AND LEAD TO GREATER BANDWIDTH USAGE.');
      /**
       * if there are no efficient way of checking update, make a warning notification once
       */
      this.bruteForceNotified = true;
    }

    let updated = false;
    let records = await this.readAllRecords();
    let newlist = {},
      type, record = {},
      list = this.lookup;
    for (let record of records)
    {
      newlist[record[this.primaryKey]] = record;
    }

    if (!list)
    {
      this.lookup = newlist;
      return false;
    }

    // check for deleted item
    type = 'delete';
    for (let item in list)
    {
      if (!newlist[item])
      {
        record[this.primaryKey] = item;
        this.emit(type, record);
        delete list[record[this.primaryKey]];
        updated = true;
      }
    }

    // check for new items
    type = 'create';
    for (let item in newlist)
    {
      if (!list[item])
      {
        record = newlist[item];
        this.emit(type, record);
        updated = true;
        list[record[this.primaryKey]] = record;
      }
    }

    // check for modified items
    type = 'update';
    for (let item in list)
    {
      if (JSON.stringify(list[item]) !== JSON.stringify(newlist[item]))
      {
        record = newlist[item];
        this.emit(type, record);
        updated = true;
        list[record[this.primaryKey]] = record;
      }
    }
    return updated;
  }

  /**
   * Stop checking for updates.
   * Required for use with CachedCollection
   */
  stopRecordUpdateCheck()
  {
    if (this.timeout)
    {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
  }

}

module.exports = Storage;
