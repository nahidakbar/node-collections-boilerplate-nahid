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
const elasticsearch = require('elasticsearch');

/**
 * Search using ElasticSearch.
 * Needs to be revised at 10000 records.
 * Needs ```elasticsearch``` package.
 */
class ElasticSearch extends Search
{
  /**
   * @override
   */
  async connect()
  {
    /**
     * reference to driver object
     */
    this.client = new elasticsearch.Client({
      host: this.connectionString,
      maxRetries: 90 * 1024,
      maxSockets: 1,
      requestTimeout: 1024 * 1024,
      sniffOnConnectionFault: true
    });
    try
    {
      await this.client.indices.delete({
        index: this.collectionName,
      });
    }
    catch (e)
    {
      // might fail if this is the first time
    }
  }

  /**
   * @override
   */
  initialise(searchMeta, records)
  {
    /** store for later use */
    this.searchMeta = searchMeta;
    return new Promise((resolve, reject) =>
    {
      this.client.indices.create({
          index: this.collectionName,
        })
        .then(() =>
        {
          let that = this;

          function upload()
          {
            resolve(Promise.all(records.map(record => that.createRecord(record))));
          }

          function sort()
          {
            let properties = {};
            let fields = searchMeta.fields || {};
            Object.keys(fields)
              .filter(f => !fields[f].dummy)
              .forEach(field => properties[field] = {
                type: "keyword"
              });
            let weights = Object.keys(searchMeta.searchWeights || {});
            weights.forEach(field =>
            {
              properties[field] = properties[field] || {
                type: "text",
                fielddata: true
              };
              properties[field].type = "text";
              properties[field].fielddata = true;
              properties[field].analyzer = "fulltext_analyzer";
            });
            let sorts = searchMeta.sort || [];
            sorts.forEach(field =>
            {
              properties[field] = properties[field] || {
                type: "text",
              };
              properties[field].fields = {
                case_insensitive: {
                  "type":     "string",
                  "analyzer": "case_insensitive",
                  fielddata: true
                }
              }
              if (properties[field].type === 'text')
              {
                properties[field].fielddata = true;
              }
            });
            return that.client.indices.putMapping({
              index: that.collectionName,
              type: that.collectionName,
              body: {
                properties
              },
            });
          }

          function analyse()
          {
            return new Promise((resolve, reject) =>
            {
              that.client.indices.close({
                  index: that.collectionName
                })
                .then(() =>
                {
                  that.client.indices.putSettings({
                      index: that.collectionName,
                      body: {
                        "settings": {
                          "analysis": {
                            "analyzer": {
                              "fulltext_analyzer": {
                                "tokenizer": "standard",
                                "filter": ["standard", "lowercase", "asciifolding", "porter_stem"]
                              },
                              "case_insensitive": {
                                "tokenizer": "keyword",
                                "filter":  [ "lowercase", "asciifolding" ]
                              }
                            }
                          }
                        }
                      }
                    })
                    .then(() =>
                    {
                      that.client.indices.open({
                          index: that.collectionName
                        })
                        .then(resolve, reject);
                    }, reject);
                }, reject);
            });
          }
          analyse()
            .then(() => sort()
              .then(upload, reject), reject);
        }, reject);
    });
  }

  /**
   * @override
   */
  createRecord(record)
  {
    return this.updateRecord(record);
  }

  /**
   * @override
   * TODO: I think there is a bug with exisint record
   */
  async updateRecord(record)
  {
    record = Object.assign({}, record);
    const id = record[this.primaryKey];
    delete record[this.primaryKey];
    for (let x in record)
    {
      if (x.match(/(^_|password|roles|meta)/g))
      {
        delete record[x];
      }
    }
    try
    {
      return await this.client.create({
        index: this.collectionName,
        type: this.collectionName,
        id: id,
        body: record,
        refresh: true
      });
    }
    catch (e)
    {
      return await this.client.update({
        index: this.collectionName,
        type: this.collectionName,
        id: id,
        body: {
          doc: record
        },
        refresh: true
      });
    }
  }

  /**
   * @override
   */
  deleteRecord(record)
  {
    return this.client.delete({
      index: this.collectionName,
      type: this.collectionName,
      id: record[this.primaryKey],
      refresh: true
    });
  }

  /**
   * @override
   */
  searchRecords(inquery)
  {
    const searchMeta = this.searchMeta;
    return new Promise((resolve, reject) =>
    {
      let query = [

      ];

      if (inquery.filter.length === 0)
      {
        query.push({
          match_all: {}
        });
      }
      else
      {
        inquery.filter.forEach(infilter =>
        {
          if (infilter.filter === 'equals')
          {
            let term = {};
            term[infilter.field] = infilter.value[0];
            query.push({
              term
            })
          }
          else if (infilter.filter === 'within')
          {
            let terms = {};
            terms[infilter.field] = infilter.value;
            query.push({
              terms
            })
          }
          else if (infilter.filter === 'regex')
          {
            let regexp = {};
            regexp[infilter.field] = infilter.value[0];
            if (regexp[infilter.field].match(/^\^/))
            {
              regexp[infilter.field] = regexp[infilter.field].substr(1)
            }
            if (regexp[infilter.field].match(/\$$/))
            {
              regexp[infilter.field] = regexp[infilter.field].substr(0, regexp[infilter.field].length - 1)
            }
            query.push({
              regexp
            })
          }
          else if (infilter.filter === 'search')
          {
            let query_string = {};
            query_string.query = infilter.value[0];
            if (searchMeta.searchWeights)
            {
              query_string.fields = Object.keys(searchMeta.searchWeights)
                .map(key => `${key}^${searchMeta.searchWeights[key]}`);
            }
            query_string.analyzer = "fulltext_analyzer";
            query.push({
              query_string
            })
          }
          else
          {
            console.error('Unhandelled Filter', infilter);
          }
        });
      }

      if (query.length === 1)
      {
        query = query[0];
      }
      else
      {
        query = {
          bool: {
            must: query
          }
        };
      }

      let body = {
        query
      };

      body.sort = {};
      if (!inquery.sort || inquery.sort === "search")
      {
        inquery.sort = '_score';
      }
      else
      {
        inquery.sort += '.case_insensitive'
      }
      body.sort[inquery.sort] = inquery.order === 'dsc'? 'desc' : 'asc';
      this.client.search({
          index: this.collectionName,
          body,
          size: 10000,
          _source: false
        })
        .then(results =>
        {
          results = results.hits.hits.map(h => h._id);
          resolve(results);
        }, reject);
    });
  }

}

module.exports = ElasticSearch;
