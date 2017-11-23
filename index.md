# Class

## `CachedCollection`

In memory version of collection. Since all the data is in memory, it also does basic facets analysis.

### `lookup: Map<string,Record>`

Mappint of primary key to records

### `initialise(): *`

Builds up records in mmory. Sets up event listeners to keep everything up to date.

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `createRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `readRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `updateRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `deleteRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `searchRecords(query: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| query | * | nullable: undefined |

## `Collection`

Should be the class that programs interact with. It should take care of syncing data between storage and search.

### `constructor(options;: object)`

### `storage: Storage`

where data is stored

### `search: Search`

instance of Search

### `collectionName: string`

name of collection

### `primaryKey: string`

id field of records

### `searchMeta: SearchMeta`

search definition

### `initialise(): *`

Call this to connect to storage units and search

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `create(storage: *, search: *, Class: *): *`

Helper creation method

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| storage | * | nullable: undefined |
| search | * | nullable: undefined |
| Class | * | nullable: undefined |

### `createRecord(record: *): *`

Add a new record to collection.

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `readRecord(record: *): *`

Read an existing record.

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `updateRecord(record: *): *`

Update an existing record.

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `updateField(record: *, field: *, value: *)`

Update field of a record. Override this to inject custom processing rules.

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |
| field | * | nullable: undefined |
| value | * | nullable: undefined |

### `deleteRecord(record: *): *`

Delete a record from collection

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `searchRecords(query: *): {"results": *}`

Search for records in collection using query.

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| query | * | nullable: undefined |

### `stripRecord(record: *, extra: *[]): *`

Strips a record to return as search result.

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |
| extra | *[] | nullable: undefined, optional: true, default: [] |

## `ElasticSearch`

Search using ElasticSearch. Needs to be revised at 10000 records. Needs ```elasticsearch``` package.

### `client: *`

reference to driver object

### `searchMeta: *`

store for later use

### `connect()`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `initialise(searchMeta: *, records: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| searchMeta | * | nullable: undefined |
| records | * | nullable: undefined |

### `createRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `updateRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `deleteRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `searchRecords(inquery: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| inquery | * | nullable: undefined |

## `MongoSearch`

Search using mongodb query engine. Requres ```mongodb``` package.

### `initialise(searchMeta: *, records: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| searchMeta | * | nullable: undefined |
| records | * | nullable: undefined |

### `searchRecords(inquery: *, limit: number): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| inquery | * | nullable: undefined |
| limit | number | nullable: undefined, optional: true, default: 0 |

## `NoSearch`

Provides no search capability. A list of all ids are always returned

### `ids: *`

stored ids

### `initialise(searchMeta: *, records: *)`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| searchMeta | * | nullable: undefined |
| records | * | nullable: undefined |

### `createRecord(record: *)`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `updateRecord(record: *)`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `deleteRecord(record: *)`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `searchRecords(query: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| query | * | nullable: undefined |

## `Search`

### `constructor(options: StorageOptions)`

### `primaryKey: *`

Id field of records

### `connectionString: *`

Connection string for search

### `collectionName: *`

Name of collection. Derived from connection string if there is # based seperation.

### `connect()`

connect to search system

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `initialise(searchMeta: *, records: *)`

Initialised search system with initial set of records

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| searchMeta | * | nullable: undefined |
| records | * | nullable: undefined |

### `createRecord(record: *)`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `updateRecord(record: *)`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `deleteRecord(record: *)`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `searchRecords(query: *)`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| query | * | nullable: undefined |

## `DynamoStorage`

Use a AWS DynamoDB table as storage. Pretty pointless storage system but have some legacy data in it. Needs ```aws-sdk``` package.

### `constructor(options: StorageOptions)`

### `region: *`

AWS region

### `db: *`

reference to driver object

### `useStreams: boolean`

Set it to true to use streams for receiving data updates.

### `notifier: *`

### `updateCheckImpl: *`

### `connect()`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `readAllRecords(): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `createRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `readRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `updateRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `deleteRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

## `DynamoStorageStreamNotifier`

Implmentation of streams notification handler. Do not use directly. see useStreams option in DynamodbStorage.

### `constructor()`

### `storage: *`

### `stream: *`

### `streamArn: *`

### `shardId: *`

### `shardIterator: *`

### `connect()`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `updateCheck()`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

## `FSStorage`

Collection served from file system storage. Very useful for rapid prototyping.

### `constructor(options: StorageOptions)`

### `dirname: *`

folder path where data is kept

### `list: *`

Mapping between id and last modified data.

### `listItems(): *`

Return a mapping between record id and last modified data at directory. Used for update checking.

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `readAllRecords(): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `createRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `readRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `updateRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `deleteRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `updateCheckImpl(): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

## `MemoryStorage`

Use an array object as storage.

### `constructor()`

### `array: *`

shared array

### `readAllRecords(): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `createRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `readRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `updateRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `deleteRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

## `MongoStorage`

Mongodb collection as storage. Requires ```mongodb``` package.

### `database: *`

reference to driver database object

### `collection: *`

reference to driver collection object

### `connect(): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `readAllRecords(): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `createRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `readRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `updateRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `deleteRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

## `S3Storage`

Use a AWS S3 bucket as storage. Requires ```aws-sdk``` package.

### `constructor(options: StorageOptions)`

### `region: *`

AWS region

### `s3: *`

reference to driver object

### `connect(): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `listItems(): *`

s3 list gives us last modified date; use that to efficiently check for updates

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `readAllRecords(): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `createRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `readRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `updateRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `deleteRecord(record: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `updateCheckImpl(): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

## `Storage`

### `constructor(options: StorageOptions)`

### `primaryKey: *`

id field of record

### `connectionString: *`

Connection string for storage. e.g. for FSStorage, it is a path

### `collectionName: *`

Name of collection. Derived from connection string if there is # based seperation.

### `updateInterval: number`

Minimum duration between updates in ms

### `updateIntervalMax: number`

Maximum duration between updates in ms

### `updateIntervalSlowdownRate: number`

Rate at which update checks are slowed down when there are no updates.

### `timeout: *`

update check timeout object

### `bruteForceNotified: boolean`

if there are no efficient way of checking update, make a warning notification once

### `lookup: *`

### `connect()`

Connect to data storage

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `readAllRecords(): Array<Record>`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `createRecord(record: *)`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `readRecord(record: *)`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `updateRecord(record: *)`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `deleteRecord(record: *)`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |

### `startRecordUpdateCheck()`

Start checking for updates. Emit events when there are updates. Required for use with CachedCollection

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `updateCheckImpl(): *`

Implmentation of update checking. Override this if storage has more efficient way of checking for updates.

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

### `stopRecordUpdateCheck()`

Stop checking for updates. Required for use with CachedCollection

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |

# Function

## `dynamoDecodeRecord(record: *, primaryKey: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |
| primaryKey | * | nullable: undefined |

## `dynamoEncodeRecord(record: *, primaryKey: *): *`

| Name | Type | Attribute | Description |
| --- | --- | --- | --- |
| record | * | nullable: undefined |
| primaryKey | * | nullable: undefined |