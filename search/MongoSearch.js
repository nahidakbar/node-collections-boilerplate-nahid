/**
 * @file
 * 
 * @author Nahid Akbar
 * @year 2016
 * @copyright Data61 -
 *            Commonwealth Scientific and Industrial Research Organisation (CSIRO) -
 *            Australian Government. All rights reserved.
 */

"use strict";

const Search = require('./Search');
const mongodb = require('mongodb');
const MongoStorage = require('../storage/MongoStorage');

/**
 * Search using mongodb query engine.
 * Requres ```mongodb``` package.
 */
class MongoSearch extends Search
{
  /**
   * @override
   */
  initialise(searchMeta, records)
  {
    const searchWeights = searchMeta.searchWeights || {};
    let collection = this.collection;
    return new Promise((resolve, reject) =>
    {
      function search()
      {
        let straight = {};
        let text = {};
        let textWeights = {};
        for (let field in searchMeta.fields)
        {
          if (searchMeta.fields[field].dummy)
          {
            continue;
          }
          if (searchMeta.fields[field].searchField)
          {
            straight[searchMeta.fields[field].searchField] = 1;
          }
          else
          {
            straight[field] = 1;
          }
          if (searchMeta.fields[field].filters.indexOf('search') !== -1)
          {
            text[field] = 'text';
            textWeights[field] = 1;
          }
        }
        for (let field in searchWeights)
        {
          text[field] = 'text';
          textWeights[field] = searchWeights[field];
        }
        let promises = [];
        for (let field in straight)
        {
          let f = {};
          f[field] = straight[field];

          promises.push(collection.createIndex(f, {
            background: true,
            name: field + '_straight'
          }));
        }
        console.log("INDEX", "TEXT", text, textWeights, "NORMAL", straight);
        if (Object.keys(text)
          .length > 0)
        {
          promises.push(collection.createIndex(text, {
            background: true,
            name: 'text',
            weights: textWeights
          }));
        }
        Promise.all(promises)
          .then(resolve, reject);
      }
      //resolve();
      collection.dropIndexes(() =>
      {
        collection.removeMany({}, () =>
        {
          if (records.length > 0)
          {
            collection.insertMany(records, {}, search);
          }
          else
          {
            search();
          }
        });
      });
    });
  }

  /**
   * @override
   */
  searchRecords(inquery, limit = 0)
  {
    const collection = this.collection;
    const primaryKey = this.primaryKey;
    return new Promise((resolve, reject) =>
    {
      let query = [],
        f, hasTextSearch = false;

      inquery.filter.forEach(infilter =>
      {
        switch (infilter.filter)
        {
        case 'equals':
          f = {};
          f[infilter.field] = infilter.value[0];
          query.push(f);
          break;
        case 'within':
          f = {};
          f[infilter.field] = {
            $in: infilter.value
          };
          query.push(f);
          break;
        case 'regex':
          f = {};
          f[infilter.field] = {
            $regex: infilter.value[0]
          };
          query.push(f);
          break;
        case 'search':
          hasTextSearch = true;
          f = {
            $text: {
              $search: infilter.value[0],
              $caseSensitive: false
            }
          };
          query.push(f);
          break;
        default:
          console.error('Unhandelled Filter', infilter);
        }
      });

      if (query.length === 0)
      {
        query = {};
      }
      else if (query.length === 1)
      {
        query = query[0];
      }
      else
      {
        query = {
          $and: query
        };
      }

      let project = {
        _id: 0
      };
      if (typeof primaryKey === 'string')
      {
        project[primaryKey] = 1;
      }
      else if (typeof primaryKey === 'object')
      {
        for (let key in primaryKey)
        {
          project[key] = 1;
        }
      }

      let sort = {};
      if (inquery.sort)
      {
        console.log(inquery.sort, hasTextSearch);
        if (inquery.sort === 'search' && hasTextSearch)
        {
          project.score = {
            $meta: "textScore"
          };
          sort.score = {
            $meta: "textScore"
          };
        }
        else
        {
          sort[inquery.sort] = inquery.order === 'dsc' ? -1 : 1;
        }
      }

      console.log('MONGO QUERY', query, 'PROJECT', project, 'SORT', sort);

      let search = collection.find(query)
        .project(project)
        .sort(sort);

      if (limit)
      {
        search = search.limit(limit);
      }

      search.map(x => (typeof primaryKey === 'string') ? x[primaryKey] : x)
        .toArray()
        .then(resolve);
    });
  }

  // rest is the same as mongo storage

}

module.exports = MongoSearch;

MongoSearch.prototype.connect = MongoStorage.prototype.connect;
MongoSearch.prototype.createRecord = MongoStorage.prototype.createRecord;
MongoSearch.prototype.readRecord = MongoStorage.prototype.readRecord;
MongoSearch.prototype.updateRecord = MongoStorage.prototype.updateRecord;
MongoSearch.prototype.deleteRecord = MongoStorage.prototype.deleteRecord;
