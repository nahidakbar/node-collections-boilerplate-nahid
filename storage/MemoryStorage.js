"use strict";

const Storage = require('./Storage');

/**
 * Use an array object as storage.
 * 
 */
class MemoryStorage extends Storage
{
  constructor(options)
  {
    super(options)

    /**
     * shared array
     */
    this.array = options.array || [];
  }

  /** @override */
  async readAllRecords()
  {
    return JSON.parse(JSON.stringify(this.array));
  }

  /** @override */
  createRecord(record)
  {
    return this.updateRecord(record);
  }

  /** @override */
  async readRecord(record)
  {
    for (let item of this.array)
    {
      if (item[this.primaryKey] === record[this.primaryKey])
      {
        return JSON.parse(JSON.stringify(item));
      }
    }
    throw new Error('not found');
  }

  /** @override */
  async updateRecord(record)
  {
    for (let item of this.array)
    {
      if (item[this.primaryKey] === record[this.primaryKey])
      {
        for (let field in item)
        {
          if (record[field] === undefined)
          {
            delete item[field];
          }
        }
        for (let field in record)
        {
          if (record[field] !== undefined)
          {
            item[field] = JSON.parse(JSON.stringify(record[field]));
          }
          else
          {
            delete item[field];
          }
        }
        return JSON.parse(JSON.stringify(item));
      }
    }
    this.array.push(record);
    return record;
  }

  /** @override */
  async deleteRecord(record)
  {
    for (let index = 0; index < this.array.length; index++)
    {
      let item = this.array[index]
      if (item[this.primaryKey] === record[this.primaryKey])
      {
        this.array.splice(index, 1);

        return record;
      }
    }
    throw new Error('not found');
  }

}

module.exports = MemoryStorage;
