"use strict";

const fs = require('fs-extra');
const path = require('path');
const assert = require('assert');

function makeRecord()
{
  const id = Math.random()
    .toString(36)
  return {
    id
  };
}

function delay(ms)
{
  return new Promise(resolve => setTimeout(resolve, ms))
}

function clone(obj)
{
  return JSON.parse(JSON.stringify(obj))
}

function storageTester(Storage, options)
{
  describe(Storage.name, function ()
  {
    let storage;
    let variable;
    let updates = [];

    beforeEach(async function ()
    {
      this.timeout(40000)
      // clean storage
      variable = new Storage(options);
      await variable.connect()
      for (let record of await variable.readAllRecords())
      {
        variable.deleteRecord(record);
      }

      storage = new Storage(options);
      await storage.connect()


      storage.on('create', record => updates.push({
        event: 'create',
        record
      }));
      storage.on('update', record => updates.push({
        event: 'update',
        record
      }));
      storage.on('delete', record => updates.push({
        event: 'delete',
        record
      }));

      await delay(100);
      storage.startRecordUpdateCheck()
      await storage.updateCheckImpl()
      await delay(100);
      updates = [];
    });

    afterEach(async function ()
    {
      this.timeout(40000)
      storage.stopRecordUpdateCheck()
      try
      {
        for (let record of await storage.readAllRecords())
        {

          await storage.deleteRecord(record);

        }
      }
      catch (e)
      {
        console.error(e)
      }
    });

    it(`can instanciate empty`, async function ()
    {
      assert.equal((await storage.readAllRecords())
        .length, 0);
    });

    it(`can instanciate non-empty`, async function ()
    {
      let record = makeRecord();
      await variable.createRecord(clone(record))
      storage = new Storage(options);
      await storage.connect();
      assert.deepEqual((await storage.readAllRecords()), [record]);
    });

    it(`can create`, async function ()
    {
      let record = makeRecord();
      await variable.createRecord(clone(record));
      updates = [];
      await storage.updateCheckImpl();
      await delay(100);
      assert.deepEqual((await storage.readAllRecords()), [record]);
      assert.deepEqual(updates, [{
        event: 'create',
        record
      }]);
    });

    it(`can read existant`, async function ()
    {
      let record = makeRecord();
      await variable.createRecord(clone(record));
      assert.deepEqual((await storage.readRecord(record)), record);
    });

    it(`can't read non-existant`, async function ()
    {
      let record = makeRecord();
      try
      {
        let found = await storage.readRecord(record);
      }
      catch (e)
      {
        return
      }
      throw new Error('fail');
    });

    it(`can update`, async function ()
    {
      let record = makeRecord();
      await variable.createRecord(clone(record));
      await storage.updateCheckImpl();
      await delay(100);
      record.update = 'xxx';
      await variable.updateRecord(clone(record));
      updates = [];
      await storage.updateCheckImpl();
      await delay(100);
      assert.deepEqual((await storage.readAllRecords()), [record]);
      assert.deepEqual(updates, [{
        event: 'update',
        record
      }]);
    });

    it(`can delete existant`, async function ()
    {
      let record = makeRecord();
      await variable.createRecord(clone(record));
      await storage.updateCheckImpl();
      await delay(100)
      updates = [];
      await variable.deleteRecord(record);
      await storage.updateCheckImpl();
      assert.deepEqual((await storage.readAllRecords()), []);
      assert.deepEqual(updates, [{
        event: 'delete',
        record
      }]);
    });

    it(`can't delete non-existant`, async function ()
    {
      let record = makeRecord();
      try
      {
        await variable.deleteRecord(record);
      }
      catch (e)
      {
        return;
      }
      console.log('OPTIONAL TEST FAILED');
    });

    const COUNT = 200;
    it(`can handle long lists`, async function ()
      {
        let records = COUNT;
        while (records-- > 0)
        {
          await variable.createRecord(makeRecord())
        }
        await storage.updateCheckImpl();
        await delay(100);
        let all = await storage.readAllRecords()
        assert.equal(all.length, COUNT);
      })
      .timeout(COUNT * 400);
  });

}

module.exports = storageTester;
