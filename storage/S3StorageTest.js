"use strict";

var AWS = require('aws-sdk-mock');

// set up a mock service
const buckets = {};

AWS.mock('S3', 'listObjectsV2', function (params, callback)
{
  const bucket = buckets[params.Bucket] || {};
  const Contents = JSON.parse(JSON.stringify(Object.values(bucket)));
  Contents.forEach(item =>
  {
    item.LastModified = new Date(item.LastModified)
  })
  callback(null, {
    Contents
  });
});

AWS.mock('S3', 'getObject', function (params, callback)
{
  buckets[params.Bucket] = buckets[params.Bucket] || {};
  const bucket = buckets[params.Bucket];
  if (bucket[params.Key])
  {
    callback(null, JSON.parse(JSON.stringify(bucket[params.Key])));
  }
  else
  {
    callback(new Error('not found'), null);
  }

});

AWS.mock('S3', 'upload', function (params, callback)
{
  buckets[params.Bucket] = buckets[params.Bucket] || {};
  const bucket = buckets[params.Bucket];
  bucket[params.Key] = {
    LastModified: Date.now(),
    Key: params.Key,
    Body: JSON.parse(JSON.stringify(params.Body))
  };
  callback(null, 'done');
});

AWS.mock('S3', 'deleteObject', function (params, callback)
{
  buckets[params.Bucket] = buckets[params.Bucket] || {};
  const bucket = buckets[params.Bucket];
  delete bucket[params.Key];
  callback(null, 'done');
});

const storageTester = require('./storageTester');
const Storage = require('./S3Storage');

storageTester(Storage, {
  region: 'test',
  connectionString: 'test'
});
