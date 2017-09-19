#!/bin/bash

set -ex

# probably install local mongodb instance
# https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/
# don't bother with the old version in ubuntu repo; it's super shit

# probabl use a local elastic search instance
# https://www.elastic.co/downloads/elasticsearch

# probably use a local dynamodb instance
# http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html
# AWS_ACCESS_KEY_ID=minio AWS_SECRET_ACCESS_KEY=miniostorage aws dynamodb create-table --table-name test --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 --region test --endpoint-url http://localhost:8000

# probably use minio for s3 testing
# https://www.minio.io/downloads/#minio-server
# REGION=test MINIO_ACCESS_KEY=minio MINIO_SECRET_KEY=miniostorage ./minio server data/
# AWS_ACCESS_KEY_ID=minio AWS_SECRET_ACCESS_KEY=miniostorage aws s3 mb s3://test --region test --endpoint-url http://localhost:9000

MONGOSEARCH_TEST_HOST=mongodb://127.0.0.1:27017/test#test1 \
MONGOSTORE_TEST_HOST=mongodb://127.0.0.1:27017/test#test2 \
ELASTICSEARCH_TEST_HOST=127.0.0.1:9200#test \
AWS_ACCESS_KEY_ID=minio AWS_SECRET_ACCESS_KEY=miniostorage \
DYNAMOSTORE_TEST_REGION=test DYNAMOSTORE_TEST_HOST=http://127.0.0.1:8000#test \
S3STORE_TEST_REGION=test S3STORE_TEST_HOST=http://127.0.0.1:9000#test \
jbn test
