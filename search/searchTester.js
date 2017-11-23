"use strict";

const assert = require('assert');

function makeRecord()
{
  const id = Math.random()
    .toString(36)
  return {
    id
  };
}

function basicSearchTests(Search, options)
{
  describe(`${Search.name} Basic`, function ()
  {
    let search;
    beforeEach(async function ()
    {
      search = new Search(options);
      await search.connect();
      await search.initialise({}, []);
    });

    it('can make new record', async function ()
    {
      let record = makeRecord();
      await search.createRecord(record);
      let results = await search.searchRecords({
        filter: []
      });
      assert.equal(results[0], record.id);
    });

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
  });
}


const TEST_SEARCH_META = {
  fields: {
    search: {
      filters: [
        'search',
      ],
      dummy: true
    },
    hierarchy: {
      filters: [
        'regex',
        'equals',
        'within',
        'search',
      ]
    },
    hierarchyX: {
      filters: [
        'within'
      ],
      searchField: 'hierarchy'
    }
  },
  sort: ['search', 'name', 'hierarchy'],
  limit: {
    minimum: 1,
    default: 20,
    maximum: 1000
  },
  facets: [
    "hierarchy"
  ],
  searchWeights: {
    "name": 10,
    "text.value": 1,
  }
};

const TEST_SEARCH_DATA = [{
  id: '1',
  name: 'Robots',
  text: [{
    value: '2005 American computer-animated science fiction adventure comedy film produced by Blue Sky Studios'
  }],
  hierarchy: ['AAAAA', 'B', 'C']
}, {
  id: '2',
  name: 'Robot Chicken',
  text: [{
    value: 'American stop motion sketch comedy television series, created and executive produced for Adult Swim by Seth Green and Matthew Senreich '
  }],
  password: 'asdf'
}, {
  id: '3',
  name: 'Robocop',
  text: [{
    value: 'cyberpunk science fiction superhero action film directed by Paul Verhoeven and'
  }, {
    value: 'written by Edward Neumeier and Michael Miner'
  }]
}, {
  id: '4',
  name: 'Aliens and Robots',
  text: [{
    value: 'incredible strength... Superior intelligence... And even the ability to reproduce. In th'
  }]
}, {
  id: '5',
  name: 'mr. Robot',
  text: [{
    value: 'Young, anti-social computer programmer Elliot works as a cybersecurity engineer during the day, but at night he is a vigilante hacker. He is recruited by the mysterious l'
  }],
  hierarchy: ['BAAAAA', 'BB', 'BC']
}];

function advancedSearchTests(Search, options)
{
  describe(`${Search.name} Advanced`, function ()
  {
    let search;
    beforeEach(async function ()
    {
      search = new Search(options);
      await search.connect();
      await search.initialise(TEST_SEARCH_META, TEST_SEARCH_DATA);
    });

    it('can do empty search', async function ()
    {
      let results = await search.searchRecords({
        filter: []
      });
      assert.equal(results.length, 5)
    });

    if (Search.name === 'MongoSearch')
    {
      // mongo driver has some additional features where it can limit number of ids returned as well as use a list of primary keys
      it('can do limited search', async function ()
      {
        search.primaryKey = {
          id: 1
        };
        let results = await search.searchRecords({
          filter: []
        }, 1);
        assert.equal(results.length, 1)
      });
    }

    it('can sort asc', async function ()
    {
      let results = await search.searchRecords({
        filter: [],
        sort: 'name',
        order: 'asc',
      });
      assert.equal(results.length, 5)
    });

    it('can sort dsc', async function ()
    {
      let results = await search.searchRecords({
        filter: [],
        sort: 'name',
        order: 'dsc',
      });
      assert.equal(results.length, 5)
    });

    it('can sort asc 2', async function ()
    {
      let results = await search.searchRecords({
        filter: [],
        sort: 'hierarchy',
        order: 'asc',
      });
      assert.equal(results.length, 5)
    });

    it('can sort dsc 2', async function ()
    {
      let results = await search.searchRecords({
        filter: [],
        sort: 'hierarchy',
        order: 'dsc',
      });
      assert.equal(results.length, 5)
    });

    async function termSearch(term, field = 'search', filter = 'search')
    {
      return await search.searchRecords({
        filter: [{
          field: field,
          filter: filter,
          value: [term]
        }],
        sort: 'search',
        order: 'dsc',
      })
    }

    ['robot', 'robots'].forEach(term =>
    {
      it('can search field text', async function ()
      {
        assert.equal((await termSearch(term))
          .length, 4)
      });
    });

    ['young', 'TELEVISION'].forEach(term =>
    {
      it('can search subfield text', async function ()
      {
        assert.equal((await termSearch(term))
          .length, 1)
      });
    });

    it('can search regex', async function ()
    {
      assert.equal((await termSearch('^A.*$', 'hierarchy', 'regex'))
        .length, 1)
      assert.equal((await termSearch('^.*A.*$', 'hierarchy', 'regex'))
        .length, 2)
      assert.equal((await termSearch('.*A.*', 'hierarchy', 'regex'))
        .length, 2)
    });

    it('can search within', async function ()
    {
      assert.equal((await termSearch('B', 'hierarchy', 'within'))
        .length, 1)
      assert.equal((await termSearch('BC', 'hierarchy', 'within'))
        .length, 1)
    });

    it('can search equals', async function ()
    {
      assert.equal((await termSearch('B', 'hierarchy', 'equals'))
        .length, 1)
      assert.equal((await termSearch('BC', 'hierarchy', 'equals'))
        .length, 1)
    });

    it('can have >1 query', async function ()
    {
      let results = await search.searchRecords({
        filter: [{
          field: 'hierarchy',
          filter: 'within',
          value: ['B', 'BC']
        }, {
          field: 'hierarchy',
          filter: 'regex',
          value: ['^.*B.*$']
        }, {
          field: 'search',
          filter: 'search',
          value: ['robot']
        }, {
          field: 'dummy',
          filter: 'dummy',
          value: ['dummy']
        }],
        sort: 'search',
        order: 'dsc',
      });
      assert.equal(results.length, 2)
    });

  })
}

function searchTester(Search, options)
{
  basicSearchTests(Search, options);
  if (Search.name !== 'NoSearch')
  {
    advancedSearchTests(Search, options);
  }
}

module.exports = searchTester;
