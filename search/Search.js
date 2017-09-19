"use strict";

/**
 * @abstract
 * @public
 */
class Search
{

  /**
   * @param {StorageOptions} options see fields
   */
  constructor(options)
  {
    /**
     * Id field of records
     */
    this.primaryKey = options.primaryKey || 'id';
    /**
     * Connection string for search
     */
    this.connectionString = options.connectionString || '';
    /**
     * Name of collection. Derived from connection string if there is # based seperation.
     */
    this.collectionName = this.connectionString.substr(this.connectionString.indexOf('#') + 1);
    this.connectionString = this.connectionString.substr(0, this.connectionString.indexOf('#')) || this.connectionString;
  }

  /**
   * connect to search system
   */
  async connect()
  {

  }

  /**
   * Initialised search system with initial set of records
   * @abstract
   */
  async initialise(searchMeta, records)
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
   * @abstract
   */
  async searchRecords(query)
  {
    throw new Error('TODO: not immplemented');
  }
}

module.exports = Search;
