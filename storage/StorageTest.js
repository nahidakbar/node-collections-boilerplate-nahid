"use strict";

const Storage = require('./Storage')
const assert = require('assert');

describe(`${Storage.name}`, function ()
{
  let search = new Storage({});
  const ABSTRACT_METHODS = ['createRecord', 'updateRecord', 'deleteRecord', 'searchRecords'];
  ABSTRACT_METHODS.forEach(method =>
  {
    it(`${method} is abstract`, async function ()
    {
      try
      {
        await Storage.prototype[method].call(search);
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
      await Storage.prototype[method].call(search);
    })
  });
});
