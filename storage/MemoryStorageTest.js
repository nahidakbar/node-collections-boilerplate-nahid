"use strict";

const storageTester = require('./storageTester');
const Storage = require('./MemoryStorage');

storageTester(Storage, {
  array: []
});
