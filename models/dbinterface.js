var _utils = require('../utils');
var _hash = _utils.hash;
var _err = _utils.err;

exports.createCollectionIfNotExists = function(options) {
	if (typeof(options.db) === 'undefined' || 
		typeof(options.tableName) === 'undefined' || 
		typeof(options.hashKeyName) === 'undefined') {
		throw err.create(400, 'InvalidArgument', 'Must provide db, tableName, and hashKeyName');
	}

	return options.db.describeTableAsync({ TableName: options.tableName }).then(function(data) {
		return data;
	}, function(err) {
		if (err.cause.code !== 'ResourceNotFoundException') {
			throw err;
		}

		console.log('Creating table "' + options.tableName + '"...');
		return options.db.createTableAsync({
			TableName: options.tableName,
			AttributeDefinitions: [{
				AttributeName: options.hashKeyName,
				AttributeType: 'S'
			}],
			KeySchema: [{
				AttributeName: options.hashKeyName,
				KeyType: 'HASH'
			}],
			ProvisionedThroughput: {
				ReadCapacityUnits: 4,
				WriteCapacityUnits: 4
			},
		}).then(function(data) {
			console.log('Table created. Waiting for active state...');
			return waitForCollectionReady(options);
		});
	});
};

function waitForCollectionReady(options) {
	if (typeof(options.db) === 'undefined' || 
		typeof(options.tableName) === 'undefined') {
		throw err.create(400, 'InvalidArgument', 'Must provide db and tableName');
	}
	
	return options.db.describeTableAsync({ TableName: options.tableName }).then(function(data) {
		switch (data.Table.TableStatus) {
			case 'ACTIVE':
				return data;
			case 'DELETING':
				throw _err.create(500, 'InconsistentState', 'Was waiting for collection to be ready, but collection is being deleted');
			//case 'CREATING':
			//case 'UPDATING':
			default:
				return Promise.delay(2000).then(function() {
					return waitForCollectionReady(options);
				});
		}
	});
}

exports.get = function(options) {
	if (typeof(options.db) === 'undefined' || 
		typeof(options.tableName) === 'undefined' || 
		typeof(options.hashKeyName) === 'undefined' || 
		typeof(options.hashKeyVal) === 'undefined') {
		throw err.create(400, 'InvalidArgument', 'Must provide db, tableName, and hashKey');
	}

	var args = {
		TableName: options.tableName,
		Key: {},
		ConsistentRead: true,
		ReturnConsumedCapacity: 'NONE'
	};
	args.Key[options.hashKeyName] = { S: options.hashKeyVal };

	return options.db.getItemAsync(args).then(function(data) {
		if (typeof(data.Item) === 'undefined') {
			throw _err.create(404, 'NotFound', 'Not Found');
		}
		return data.Item;
	});
};

exports.save = function(options) {
	if (typeof(options.db) === 'undefined' || 
		typeof(options.tableName) === 'undefined' || 
		typeof(options.hashKeyName) === 'undefined' || 
		typeof(options.serialized) === 'undefined') {
		throw err.create(400, 'InvalidArgument', 'Must provide db, tableName, and hashKey');
	}

	var putOptions = {
		TableName: options.tableName,
		ReturnValues: 'NONE',
		ReturnConsumedCapacity: 'NONE',
		ReturnItemCollectionMetrics: 'NONE'
	};

	if (typeof(options.serialized.etag) !== 'undefined') {
		putOptions.ConditionExpression = 'etag = :etag';
		putOptions.ExpressionAttributeValues = { ':etag': options.serialized.etag };
	}
	options.serialized.etag = { N: _hash.djb2(options.serialized).toString() };

	putOptions.Item = options.serialized;

	return options.db.putItemAsync(putOptions).catch(function(err) {
		if (err.cause.code === 'ConditionalCheckFailedException') {
			throw _err.create(409, 'InvalidVersion', 'Conflict: A newer version of this item exists in the DB');
		} else {
			throw err;
		}
	});
};

exports.list = function() {
	throw _err.create(501, 'NotImplemented', 'Not Implemented');
	/*
	return dynamo.queryAsync({
		TableName: tableName,
		KeyConditions: {
			userName: {
				AttributeValueList: [
					{
						S: 'hakon'
					}
				],
				ComparisonOperator: 'EQ'
			}
		},
		Select: 'ALL_ATTRIBUTES',
		Limit: 10,
		ConsistentRead: false,
		ScanIndexForward: true,
		ReturnConsumedCapacity: 'NONE'
	});
	*/
	/*
	return dynamo.scanAsync({
		TableName: tableName,
		Select: 'ALL_ATTRIBUTES',
		Limit: 10,
		ReturnConsumedCapacity: 'NONE'
	});
	*/
};
