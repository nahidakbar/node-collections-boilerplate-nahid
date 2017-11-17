"use strict";

const Collection = require('./Collection');

/**
 * In memory version of collection.
 * 
 * Since all the data is in memory, it also does basic facets analysis.
 */
class CachedCollection extends Collection
{
  /**
   * Builds up records in mmory.
   * Sets up event listeners to keep everything up to date.
   * @override
   */
  async initialise()
  {
    let records = await super.initialise();
    /**
     * Mappint of primary key to records
     * @type {Map<string,Record>}
     */
    this.lookup = {};

    // populate lookup list
    for (let record of records)
    {
      let pkValue = record[this.primaryKey]
      this.lookup[pkValue] = record;
    }

    // set up listeners
    this.storage.on('create', record =>
    {
      console.log('NOTIFY CREATED', this.collectionName, record[this.primaryKey]);
      this.lookup[record[this.primaryKey]] = record;
      this.search.createRecord(record)
        .then(x => x, console.log.bind(console));
    });
    this.storage.on('update', record =>
    {
      console.log('NOTIFY UPDATED', this.collectionName, record[this.primaryKey]);
      this.lookup[record[this.primaryKey]] = record;
      this.search.updateRecord(record)
        .then(x => x, console.log.bind(console));
    });

    this.storage.on('delete', record =>
    {
      console.log('NOTIFY DELETED', this.collectionName, record[this.primaryKey]);
      delete this.lookup[record[this.primaryKey]];
      this.search.deleteRecord(record)
        .then(x => x, console.log.bind(console));
    });

    // install updater
    // see if storage has some clever way of receiving updates
    this.storage.startRecordUpdateCheck()

    return records;
  }

  /**
   * @override
   */
  createRecord(record)
  {
    this.lookup[record[this.primaryKey]] = record;
    return super.createRecord(record);
  }

  /**
   * @override
   */
  async readRecord(record)
  {
    record = this.lookup[record[this.primaryKey]];
    if (!record)
    {
      return super.readRecord(record);
    }
    else
    {
      return this.lookup[record[this.primaryKey]];
    }
  }

  /**
   * @override
   */
  updateRecord(record)
  {
    this.lookup[record[this.primaryKey]] = record;
    return super.updateRecord(record);
  }

  /**
   * @override
   */
  deleteRecord(record)
  {
    try
    {
      delete this.lookup[record[this.primaryKey]];
    }
    catch (e)
    {
      console.log(e)
    }
    return super.deleteRecord(record);
  }

  /**
   * @override
   */
  searchRecords(query)
  {
    return new Promise((resolve, reject) =>
    {
      let offset = query.offset;
      delete query.offset;
      let limit = query.limit;
      delete query.limit;
      this.search.searchRecords(query)
        .then(records =>
        {
          let results = {
            results: records,
            total: records.length,
            offset: offset,
          };

          if (query.returnFacets)
          {
            let facets = {};
            for (let facet of this.searchMeta.facets)
            {
              facets[facet] = {};
            }
            for (let id of records)
            {
              let record = this.lookup[id];
              for (let facet of this.searchMeta.facets)
              {
                let facetValues = (record[facet] || []);
                if (typeof facetValues === 'string')
                {
                  let value = facetValues;
                  facets[facet][value] = (facets[facet][value] || 0) + 1;
                }
                else
                {
                  for (let value of facetValues)
                  {
                    facets[facet][value] = (facets[facet][value] || 0) + 1;
                  }
                }
              }
            }
            results.facets = facets;
          }

          if (query.sort)
          {
            results.sort = query.sort;
            results.order = query.order;
          }
          records = records.splice(offset, limit);
          records = records.map(id =>
          {
            let query = {};
            query[this.primaryKey] = id;
            return this.readRecord(query);
          });
          Promise.all(records)
            .then(records =>
            {
              results.results = records.map(x => this.stripRecord(x, query.extra));
              resolve(results);
            }, reject);
        }, reject);
    });
  }

}

module.exports = CachedCollection;

CachedCollection.create = Collection.create;
