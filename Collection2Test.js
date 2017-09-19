"use strict";

const EventEmitter = require('events');
const assert = require('assert');
const Collections = [
  require('./Collection'),
  require('./CachedCollection')
];

Collections.forEach(Collection =>
{

  Collection.collectionName = 'collection-' + Math.random();
  Collection.primaryKey = 'id';
  Collection.searchMeta = 'SEARCH META';

  describe(Collection.name, function ()
  {
    let storage = {};
    let search = {};
    let args = [];

    function reject(reason = 'Who knows why!', label = 'reject')
    {
      return function ()
      {
        args.push({
          args: Array.prototype.slice.call(arguments),
          label
        });
        return new Promise((resolve, reject) =>
        {
          reject(reason);
        });
      }
    }

    function resolve(data, label = 'resolve')
    {
      return function ()
      {
        args.push({
          args: Array.prototype.slice.call(arguments),
          label
        });
        return new Promise((resolve, reject) =>
        {
          resolve(data);
        });
      }
    }

    function haveCall(label)
    {
      for (let arg of args)
      {
        if (arg.label === label)
        {
          return arg.args;
        }
      }
      throw new Error(label + ' not called');
    }

    beforeEach(function (done)
    {
      args = [];
      storage = new EventEmitter();
      storage.connect = resolve()
      storage.startRecordUpdateCheck = resolve();
      done();
    });

    it(`should forward initialisation error 1`, function (done)
    {
      storage.readAllRecords = reject(1);
      Collection.create(storage, search, Collection)
        .then(() => done('ERR'), () => done());
    });

    it(`should forward initialisation error 2`, function (done)
    {
      storage.readAllRecords = resolve([]);
      search.initialise = reject(2);
      Collection.create(storage, search, Collection)
        .then(() => done('ERR'), () => done());
    });

    it(`should initialise empty`, function (done)
    {
      storage.readAllRecords = resolve([]);
      search.initialise = resolve([]);
      Collection.create(storage, search, Collection)
        .then(() => done(), err => done(err));
    });

    it(`should initialise with data`, function (done)
    {
      storage.readAllRecords = resolve('SEARCH DATA', 'storage get all records');
      search.initialise = resolve([], 'search initialise');
      Collection.create(storage, search, Collection)
        .then(() =>
        {
          assert.equal(haveCall('search initialise')[0], 'SEARCH META');
          assert.equal(haveCall('search initialise')[1], 'SEARCH DATA');
          done()
        }, err => done(err));
    });

    describe(`once initialised`, function ()
    {
      let collection = false;
      beforeEach(function (done)
      {
        storage.readAllRecords = resolve([{
          id: '1'
        }], 'storage get all records');
        search.initialise = resolve([], 'search initialise');
        Collection.create(storage, search, Collection)
          .then(collection_ =>
          {
            collection = collection_;
            done()
          }, err => done(err));
      });

      it(`should create records successfully`, function (done)
      {
        storage.createRecord = resolve({
          id: '3'
        }, 'storage');
        search.createRecord = resolve(true, 'search');
        collection.createRecord({
            id: '2'
          })
          .then(record =>
          {
            haveCall('storage');
            haveCall('search');
            assert.equal(record.id, '3')
            done();
          }, done);
      });

      it(`should forward create record errors 1`, function (done)
      {
        storage.createRecord = reject(true, 'search');
        collection.createRecord({
            id: '2'
          })
          .then(() => done('ERR'), () => done());
      });

      it(`should forward create record errors 2`, function (done)
      {
        storage.createRecord = resolve({
          id: '3'
        }, 'storage');
        search.createRecord = reject(true, 'search');
        collection.createRecord({
            id: '2'
          })
          .then(() => done('ERR'), () => done());
      });

      it(`should read record successfully`, function (done)
      {
        storage.readRecord = resolve({
          id: '1'
        }, 'storage');
        collection.readRecord({
            id: '1'
          })
          .then(record =>
          {
            if (Collection.name !== 'CachedCollection')
            {
              assert.equal(haveCall('storage')[0].id, '1');
            }
            assert.equal(record.id, '1')
            done();
          }, done);
      });

      it(`should forward read record errors`, function (done)
      {
        storage.readRecord = reject(true, 'storage');
        collection.createRecord({
            id: '2'
          })
          .then(() => done('ERR'), () => done());
      });

      it(`should update records successfully`, function (done)
      {
        storage.updateRecord = resolve({
          id: '1',
          update: 'update'
        }, 'storage');
        search.updateRecord = resolve(true, 'search');
        collection.updateRecord({
            id: '1'
          })
          .then(record =>
          {
            assert.equal(haveCall('storage')[0].id, '1');
            haveCall('search');
            assert.equal(record.id, '1')
            assert.equal(record.update, 'update')
            done();
          }, done);
      });

      it(`should forward update record errors 1`, function (done)
      {
        storage.updateRecord = reject(true, 'search');
        collection.updateRecord({
            id: '1'
          })
          .then(() => done('ERR'), () => done());
      });

      it(`should forward update record errors 2`, function (done)
      {
        storage.updateRecord = resolve({
          id: '1'
        }, 'storage');
        search.updateRecord = reject(true, 'search');
        collection.updateRecord({
            id: '1'
          })
          .then(() => done('ERR'), () => done());
      });

      it(`should delete records successfully`, function (done)
      {
        storage.deleteRecord = resolve({
          id: '1.2'
        }, 'storage');
        search.deleteRecord = resolve(true, 'search');
        collection.deleteRecord({
            id: '1'
          })
          .then(record =>
          {
            assert.equal(haveCall('storage')[0].id, '1');
            haveCall('search');
            assert.equal(record.id, '1.2')
            done();
          }, done);
      });

      it(`should forward delete record errors 1`, function (done)
      {
        storage.deleteRecord = reject(true, 'search');
        collection.deleteRecord({
            id: '1'
          })
          .then(() => done('ERR'), () => done());
      });

      it(`should forward delete record errors 2`, function (done)
      {
        storage.deleteRecord = resolve({
          id: '1'
        }, 'storage');
        search.deleteRecord = reject(true, 'search');
        collection.deleteRecord({
            id: '1'
          })
          .then(() => done('ERR'), () => done());
      });

      it(`should handle emitted events`, function ()
      {
        storage.emit('create', {});
        storage.emit('update', {});
        storage.emit('delete', {});
      });
    });

  });
});
