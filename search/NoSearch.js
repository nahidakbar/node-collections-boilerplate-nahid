"use strict";

const Search = require('./Search');

/**
 * Provides no search capability.
 * A list of all ids are always returned
 */
class NoSearch extends Search
{
  /**
   * @override
   */
  async initialise(searchMeta, records)
  {
    /**
     * stored ids
     */
    this.ids = records.map(record => record[this.primaryKey]);
  }

  /**
   * @override
   */
  async createRecord(record)
  {
    this.ids.push(record[this.primaryKey]);
  }

  /**
   * @override
   */
  async updateRecord(record)
  {}

  /**
   * @override
   */
  async deleteRecord(record)
  {
    this.ids = this.ids.filter(id => id !== record[this.primaryKey]);
  }

  /**
   * @override
   */
  async searchRecords(query)
  {
    return this.ids.slice();
  }
}

module.exports = NoSearch;
