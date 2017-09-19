"use strict";

const assert = require('assert');
const Search = require('./search/NoSearch');
const Storage = require('./storage/MemoryStorage');

const TEST_DATA = [{
  id: '1',
  facet1: '1.11',
  facet2: ['1.21', '1.22'],
  extra: 'extea'
}, {
  id: '2',
  facet1: '2.11',
  filter: 'filter'
}, {
  id: '3',
  facet2: ['3.21', '1.22']
}];

const TEST_SEARCH_META = {
  fields: {
    filter: {

    }
  },
  facets: [
    'facet1',
    'facet2'
  ]
};

function collectionTester(Collection)
{
  describe(`${Collection.name} Basic`, function ()
  {
    let collection;
    beforeEach(async function ()
    {
      const array = JSON.parse(JSON.stringify(TEST_DATA));
      const search = new Search({});
      await search.connect();
      const storage = new Storage({
        array
      });
      await storage.connect();
      const searchMeta = JSON.parse(JSON.stringify(TEST_SEARCH_META));
      collection = new Collection({
        storage,
        search,
        searchMeta
      });
      await collection.initialise();
    });

    it('can create', async function ()
    {
      const id = Math.random()
        .toString('22');
      let record = await collection.createRecord({
        id
      });
      assert.deepEqual(record.id, id);
    });

    it('can read', async function ()
    {
      const id = '1';
      let record = await collection.readRecord({
        id
      });
      assert.deepEqual(record, TEST_DATA[0]);
    });

    it('can update', async function ()
    {
      const id = '1';
      const update = Math.random()
        .toString(22);
      let inRecord = {
        id,
        update
      };
      await collection.updateRecord(inRecord);
      let record = await collection.readRecord({
        id
      });
      assert.deepEqual(record, inRecord);
    });

    it('can delete', async function ()
    {
      const id = '1';
      await collection.deleteRecord({
        id
      });
      try
      {
        await collection.readRecord({
          id
        });
      }
      catch (e)
      {
        return;
      }
      throw new Error('FAIL');
    });

    it('can search', async function ()
    {
      const query = {
        offset: 0,
        limit: 2,
        extra: ['extra'],
        returnFacets: true,
        sort: true,
        order: true
      };
      const results = await collection.searchRecords(query);
      assert.deepEqual(results.results, [{
        id: '1',
        extra: 'extea'
      }, {
        id: '2',
        filter: 'filter'
      }]);
      if (results.facets)
      {
        // optional
        assert.deepEqual(results.facets, {
          facet1: {
            '1.11': 1,
            '2.11': 1
          },
          facet2: {
            '1.21': 1,
            '1.22': 2,
            '3.21': 1
          }
        });
      }
    });

    /*
    it('can update existing record', async function ()
    {
      let record = makeRecord();
      await search.createRecord(record);
      await search.updateRecord(record);
      let results = await search.searchRecords({
        filter: []
      });
      assert.equal(results[0], record.id);
    });

    it('can delete existing record', async function ()
    {
      let record = makeRecord();
      await search.createRecord(record);
      await search.deleteRecord(record);
      let results = await search.searchRecords({
        filter: []
      });
      assert.equal(results.length, 0);
    });
    */
  });
}

module.exports = collectionTester;
