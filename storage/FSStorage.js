"use strict";

const fs = require('fs');
const path = require('path');

const Storage = require('./Storage');

/**
 * Collection served from file system storage.
 * 
 * Very useful for rapid prototyping.
 */
class FSStorage extends Storage
{
  /**
   * @param {StorageOptions} options see fields
   */
  constructor(options)
  {
    super(options)
    /**
     * folder path where data is kept
     */
    this.dirname = options.connectionString;
    try
    {
      if (!fs.existsSync(this.dirname))
      {
        fs.mkdirSync(this.dirname);
      }
    }
    catch (e)
    {

    }
    /**
     * Mapping between id and last modified data.
     */
    this.list = this.listItems();
  }

  /**
   * Return a mapping between record id and last modified data at directory.
   * Used for update checking.
   */
  listItems()
  {
    let output = {};
    for (let file of fs.readdirSync(this.dirname))
    {
      if (file.match(/\.json$/))
      {
        let stat = fs.statSync(path.join(this.dirname, file));
        if (stat.isFile())
        {
          output[file.substr(0, file.length - 5)] = stat.mtime;
        }
      }
    }
    return output;
  }

  /** @override  */
  readAllRecords()
  {
    let output = [];
    for (let key in this.list)
    {
      let query = {};
      query[this.primaryKey] = key;
      output.push(this.readRecord(query));
    }
    return Promise.all(output);
  }

  /** @override  */
  createRecord(record)
  {
    return this.updateRecord(record);
  }

  /** @override  */
  readRecord(record)
  {
    return new Promise((resolve, reject) =>
    {
      let key = record[this.primaryKey];
      try
      {
        resolve(JSON.parse(fs.readFileSync(path.join(this.dirname, key + '.json'))));
      }
      catch (e)
      {
        reject(e);
      }
    });
  }

  /** @override  */
  updateRecord(record)
  {
    return new Promise((resolve, reject) =>
    {
      let key = record[this.primaryKey];
      let file = path.join(this.dirname, key + '.json');
      fs.writeFileSync(file, JSON.stringify(record, null, 1));
      let stat = fs.statSync(file);
      this.list[key] = stat.mtime;
      resolve(JSON.parse(fs.readFileSync(file)));
    });
  }

  /** @override  */
  deleteRecord(record)
  {
    return new Promise((resolve, reject) =>
    {
      let key = record[this.primaryKey];
      let file = path.join(this.dirname, key + '.json');
      fs.unlinkSync(file);
      delete this.list[key];
      resolve(record);
    });
  }

  /** @override  */
  async updateCheckImpl()
  {
    let updated = false;
    let newlist = this.listItems(),
      list = this.list,
      type, record = {};

    // check for deleted item
    type = 'delete';
    for (let item in list)
    {
      if (!newlist[item])
      {
        record[this.primaryKey] = item;
        this.emit(type, record);
        delete list[item];
        updated = true;
      }
    }
    // check for new items
    type = 'create';
    for (let item in newlist)
    {
      if (!list[item])
      {
        record = JSON.parse(fs.readFileSync(path.join(this.dirname, item + '.json')));
        this.emit(type, record);
        list[item] = newlist[item];
        updated = true;
      }
    }

    // check for modified items
    type = 'update';
    for (let item in list)
    {
      if (list[item].getTime() !== newlist[item].getTime())
      {
        record = JSON.parse(fs.readFileSync(path.join(this.dirname, item + '.json')));
        this.emit(type, record);
        list[item] = newlist[item];
        updated = true;
      }
    }
    return updated;
  }

}

module.exports = FSStorage;
