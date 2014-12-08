var _utils = require('../utils');
var _hash = _utils.hash;
var _err = _utils.err;

exports.createCollectionIfNotExists = function(options) {
	options = options || {};

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

		var awsOptions = {
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
		};

		if (typeof(options.rangeKeyName) !== 'undefined') {
			awsOptions.AttributeDefinitions.push({
				AttributeName: options.rangeKeyName,
				AttributeType: 'S'
			});
			awsOptions.KeySchema.push({
				AttributeName: options.rangeKeyName,
				KeyType: 'RANGE'
			});
		}

		return options.db.createTableAsync(awsOptions).then(function(data) {
			return waitForCollectionReady(options);
		});
	});
};

function waitForCollectionReady(options) {
	options = options || {};

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
	options = options || {};

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

	if (typeof(options.rangeKeyName) !== 'undefined' &&
		typeof(options.rangeKeyVal) !== 'undefined') {
		args.Key[options.rangeKeyName] = { S: options.rangeKeyVal };
	}

	return options.db.getItemAsync(args).then(function(data) {
		if (typeof(data.Item) === 'undefined') {
			throw _err.create(404, 'NotFound', 'Not Found');
		}
		return data.Item;
	});
};

exports.save = function(options) {
	options = options || {};

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

exports.createListOptions = function(db, tableName, options) {
	options = options || {};

	if (typeof(db) === 'undefined' ||
		typeof(tableName) === 'undefined') {
		throw err.create(400, 'InvalidArgument', 'Must provide db and tableName');
	}

	var opts = {
		db: db,
		tableName: tableName
	};

	if (typeof(options.hashKeyVal) !== 'undefined') {
		opts.hashKeyVal = options.hashKeyVal;
		if (typeof(options.hashKeyName) === 'undefined') {
			throw err.create(400, 'InvalidArgument', 'Must include hashKeyName with hashKeyVal');
		}
		opts.hashKeyName = options.hashKeyName;
	}

	if (typeof(options.rangeKeyVal) !== 'undefined') {
		if (typeof(options.hashKeyVal) === 'undefined') {
			throw err.create(400, 'InvalidArgument', 'Must include hash key info if using range key');
		}

		opts.rangeKeyVal = options.rangeKeyVal;
		if (typeof(options.rangeKeyName) === 'undefined') {
			throw err.create(400, 'InvalidArgument', 'Must include rangeKeyName with rangeKeyVal');
		}
		opts.rangeKeyName = options.rangeKeyName;
	}

	if (typeof(options.continuationToken) !== 'undefined') {
		opts.continuationToken = options.continuationToken;
	}

	return opts;
}

exports.list = function(options) {
	options = options || {};

	if (typeof(options.db) === 'undefined' || 
		typeof(options.tableName) === 'undefined') {
		throw err.create(400, 'InvalidArgument', 'Must provide db and tableName');
	}

	var awsOptions = {
		TableName: options.tableName,
		Select: 'ALL_ATTRIBUTES',
		Limit: 10,
		ReturnConsumedCapacity: 'NONE'
	};

	if (typeof(options.continuationToken) !== 'undefined') {
		awsOptions.ExclusiveStartKey = options.continuationToken;
	}

	if (typeof(awsOptions.ExclusiveStartKey) === 'undefined' &&
		typeof(options.hashKeyName) !== 'undefined' &&
		typeof(options.hashKeyVal) !== 'undefined') {
		awsOptions.ExclusiveStartKey = {};
		awsOptions.ExclusiveStartKey[options.hashKeyName] = options.hashKeyVal;
		if (typeof(options.rangeKeyName) !== 'undefined' &&
			typeof(options.rangeKeyVal) !== 'undefined') {
			awsOptions.ExclusiveStartKey[options.rangeKeyName] = options.rangeKeyVal;
		}
	}

	return options.db.scanAsync(awsOptions).then(function(result) {
		if (typeof(result.LastEvaluatedKey) !== 'undefined') {
		}
		return {
			items: result.Items,
			continuationToken: result.LastEvaluatedKey
		};
	});
};
