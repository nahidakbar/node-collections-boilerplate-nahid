"use strict";

const storageTester = require('./storageTester');
const Storage = require('./FSStorage');

const path = require('path');
const connectionString = path.join(__dirname, 'node_fs-storage-text');

storageTester(Storage, {
  connectionString
});
