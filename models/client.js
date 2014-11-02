var _hash = require('../utils').hash;
var _db = null;
var _tableName = 'clients';

function Client() {
}

Client.prototype.set = function(properties) {
	if (typeof(properties.userName) !== 'undefined') this.userName = properties.userName;
	if (typeof(properties.firstName) !== 'undefined') this.firstName = properties.firstName;
	if (typeof(properties.lastName) !== 'undefined') this.lastName = properties.lastName;
	if (typeof(properties.email) !== 'undefined') this.email = properties.email;
	if (typeof(properties.phone) !== 'undefined') this.phone = properties.phone;
	if (typeof(properties.userName) !== 'undefined') this.profile = properties.profile;
	if (typeof(properties.savedLocations) !== 'undefined') this.savedLocations = properties.savedLocations;
	if (typeof(properties.paymentInfo) !== 'undefined') this.paymentInfo = properties.paymentInfo;
	if (typeof(properties.appointments) !== 'undefined') this.appointments = properties.appointments;
	if (typeof(properties.joinedDate) !== 'undefined') this.joinedDate = properties.joinedDate;
	if (typeof(properties.etag) !== 'undefined') this.etag = properties.etag;

	return this;
};

Client.prototype.load = function(userName) {
	return get(userName, this);
}

Client.prototype.save = function() {
	return typeof(this.etag) === 'undefined' ? save(this) : save(this, this.etag);
};

function createCollectionIfNotExists() {
	return _db.describeTableAsync({ TableName: _tableName }).then(function(data) {
		return data;
	}, function(err) {
		if (err.cause.code !== 'ResourceNotFoundException') {
			throw err;
		}

		console.log('Creating table "' + _tableName + '"...');
		return _db.createTableAsync({
			TableName: _tableName,
			AttributeDefinitions: [{
				AttributeName: 'userName',
				AttributeType: 'S'
			}],
			KeySchema: [{
				AttributeName: 'userName',
				KeyType: 'HASH'
			}],
			ProvisionedThroughput: {
				ReadCapacityUnits: 4,
				WriteCapacityUnits: 4
			},
		}).then(function(data) {
			console.log('Table created. Waiting for active state...');
			return waitForCollectionReady();
		});
	});
}

function waitForCollectionReady() {
	return _db.describeTableAsync({ TableName: _tableName }).then(function(data) {
		switch (data.Table.TableStatus) {
			case 'ACTIVE':
				return data;
			case 'DELETING':
				throw new Error('Was waiting for collection to be ready, but collection is being deleted');
			//case 'CREATING':
			//case 'UPDATING':
			default:
				return Promise.delay(2000).then(function() {
					return waitForCollectionReady();
				});
		}
	});
}

function get(userName, destObj) {
	destObj = destObj || {};

	return _db.getItemAsync({
		TableName: _tableName,
		Key: { userName: { S: userName } },
		ConsistentRead: true,
		ReturnConsumedCapacity: 'NONE'
	}).then(function(data) {
		if (typeof(data.Item) === 'undefined') {
			var err = new Error('Not Found');
			err.code = 'NotFound';
			err.statusCode = 404;
			throw err;
		}

		destObj.userName = data.Item.userName.S;
		destObj.firstName = data.Item.firstName.S;
		destObj.lastName = data.Item.lastName.S;
		destObj.email = data.Item.email.S;
		destObj.phone = data.Item.phone.S;
		destObj.profile = data.Item.profile.S;
		destObj.savedLocations = [];
		destObj.paymentInfo = data.Item.paymentInfo.S;
		destObj.appointments = [];
		destObj.joinedDate = data.Item.joinedDate.S;
		destObj.etag = data.Item.etag.N;

		data.Item.savedLocations.L.forEach(function(loc) {
			var deserializedLoc = {
				street: loc.M.street.S,
				city: loc.M.city.S,
				state: loc.M.state.S,
				zipcode: loc.M.zipcode.S
			};

			if (typeof(loc.M.unit) !== 'undefined') {
				deserializedLoc.unit = loc.M.unit;
			}

			destObj.savedLocations.push(deserializedLoc);
		});

		data.Item.appointments.L.forEach(function(appt) {
			destObj.appointments.push(appt.S);
		});

		return destObj;
	});
}

function save(client, etag) {
	if (typeof(client.userName) === 'undefined' ||
		typeof(client.firstName) === 'undefined' ||
		typeof(client.lastName) === 'undefined' ||
		typeof(client.email) === 'undefined' ||
		typeof(client.phone) === 'undefined' ||
		typeof(client.profile) === 'undefined' ||
		typeof(client.savedLocations) === 'undefined' ||
		typeof(client.paymentInfo) === 'undefined' ||
		typeof(client.appointments) === 'undefined' ||
		typeof(client.joinedDate) === 'undefined') {
		throw new Error('Missing required fields');
	}

	var serialized = {
		userName: { S: client.userName },
		firstName: { S: client.firstName },
		lastName: { S: client.lastName },
		email: { S: client.email },
		phone: { S: client.phone },
		profile: { S: client.profile },
		savedLocations: { L: [] },
		paymentInfo: { S: client.paymentInfo },
		appointments: { L: [] },
		joinedDate: { S: client.joinedDate }
	};

	client.savedLocations.forEach(function(loc) {
		var entry = {
			M: {
				street: { S: loc.street },
				city: { S: loc.city },
				state: { S: loc.state },
				zipcode: { S: loc.zipcode }
			}
		};
		if (typeof(loc.unit) !== 'undefined') {
			entry.M.unit = { S: loc.unit };
		}
		serialized.savedLocations.L.push(entry);
	});

	client.appointments.forEach(function(appt) {
		serialized.appointments.L.push({ S: appt });
	});

	serialized.etag = { N: _hash.djb2(serialized).toString() };

	var options = {
		TableName: _tableName,
		Item: serialized,
		ReturnValues: 'NONE',
		ReturnConsumedCapacity: 'NONE',
		ReturnItemCollectionMetrics: 'NONE'
	};

	if (etag) {
		options.ConditionExpression = 'etag = :etag';
		options.ExpressionAttributeValues = { ":etag": { N: etag } };
	}

	return _db.putItemAsync(options).then(function() {
		client.etag = serialized.etag.N;
	}).catch(function(err) {
		if (err.cause.code === 'ConditionalCheckFailedException') {
			var newErr = new Error('Conflict: A newer version of this item exists in the DB');
			newErr.code = 'InvalidVersion';
			newErr.statusCode = 409;
			throw newErr;
		} else {
			throw err;
		}
	});
}

function list() {
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
	var err = new Error('Not Implemented');
	err.code = 'NotImplemented';
	err.statusCode = 501;
	throw err;
}

module.exports = {
	init: function(db) {
		if (!db) {
			throw new Error('Must provide db');
		}
		_db = db;
		return createCollectionIfNotExists();
	},
	create: function() {
		return new Client();
	},
	list: list
};
