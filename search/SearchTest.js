"use strict";

const Search = require('./Search')
const assert = require('assert');

describe(`${Search.name}`, function ()
{
  let search = new Search({});
  const ABSTRACT_METHODS = ['initialise', 'createRecord', 'updateRecord', 'deleteRecord', 'searchRecords'];
  ABSTRACT_METHODS.forEach(method =>
  {
    it(`${method} is abstract`, async function ()
    {
      try
      {
        await Search.prototype[method].call(search);
      }
      catch (e)
      {
        return;
      }
      throw new Error(`${method} is not abstract`);
    })
  });
  const NON_ABSTRACT_METHODS = ['connect'];
  NON_ABSTRACT_METHODS.forEach(method =>
  {
    it(`${method} is abstract`, async function ()
    {
      await Search.prototype[method].call(search);
    })
  });
});
