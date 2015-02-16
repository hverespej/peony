var Promise = require('bluebird');
var expect = loadExpect();

function loadExpect() {
	var chai = require('chai');
	var chaiAsPromised = require('chai-as-promised');
	chai.use(chaiAsPromised);
	return chai.expect;
}

function loadDynamo() {
	var aws = require('aws-sdk');
	aws.config.update({
		apiVersion: '2014-11-01',
		accessKeyId: 'fake',
		secretAccessKey: 'fake',
		region: 'us-west-2'
	});

	var dynamo = new aws.DynamoDB({
		endpoint: 'http://localhost:8000'
	});

	Promise.promisifyAll(dynamo);

	return dynamo;
}

function clearDb(db) {
	return db.listTablesAsync({}).then(function(data) {
		var ops = [];
		data.TableNames.forEach(function(tn) {
			ops.push(db.deleteTableAsync({ TableName: tn }));
		});
		return Promise.all(ops);
	});
}

function deleteStoredItem(db, tableName, testData, done) {
	return db.deleteItemAsync({
		TableName: tableName,
		Key: testData.storageKey(),
		ReturnConsumedCapacity: 'NONE',
		ReturnItemCollectionMetrics: 'NONE',
		ReturnValues: 'NONE'
	}).then(function() {
		done();
	});
}

function testTableCreation(model, db) {
	return expect(
		model.init(db).then(function() {
			return db.listTablesAsync({});
		}).then(function(data) {
			return data.TableNames.length;
		})
	).to.eventually.equal(1);
}

function testStoreObject(model, testData, db, tableName, equalityTest) {
	var m = model.create();
	m.set(testData);
	return expect(
		m.save().then(function() {
			return db.getItemAsync({
				TableName: tableName,
				Key: testData.storageKey(),
				ConsistentRead: true,
				ReturnConsumedCapacity: 'NONE'
			});
		}).then(function(retrieved) {
			return equalityTest(retrieved);
		})
	).to.eventually.be.true;
}

function testStoreOnEtagMatch(model, testData, db, tableName) {
	var m = model.create();
	m.set(testData);
	return expect(
		m.save().then(function() {
			return db.getItemAsync({
				TableName: tableName,
				Key: testData.storageKey(),
				ConsistentRead: true,
				ReturnConsumedCapacity: 'NONE'
			});
		}).then(function(retrieved) {
			return m.save();
		})
	).to.eventually.be.fulfilled;
}

function testFailToStoreOnEtagMismatch(model, testData) {
	var m = model.create();
	m.set(testData);
	return expect(
		m.save().then(function() {
			m.etag = '1';
			return m.save();
		})
	).to.eventually.be.rejectedWith(/^Conflict:/);
}

function testFailToLoadNonExistantItem(model, options) {
	var m = model.create();
	return expect(
		m.load(options)
	).to.eventually.be.rejectedWith(/^Not Found$/);
}

function testItemExistsReturnsTrueForExistingItem(model, testData, hashKey, rangeKey) {
	var m = model.create();
	m.set(testData);
	return expect(
		m.save().then(function() {
			return model.exists(hashKey, rangeKey);
		})
	).to.eventually.be.true;
}

function testItemExistsReturnsFalseForNonExistentItem(model) {
	return expect(
		model.exists('non-existent-key-1', 'non-existent-key-2')
	).to.eventually.be.false;
}

function testListReturnsNoItemsForEmptyTable(model) {
	return expect(
		model.list().then(function(result) {
			return result.items.length;
		})
	).to.eventually.equal(0);
}

function testListShouldReturnItems(model, hashKeyName, testData, itemCount) {
	if (itemCount <= 0) {
		throw Error('itemCount must be greater than 0');
	}
	
	var items = [];
	for (var i = 0; i < itemCount; i++) {
		var m = model.create();
		m.set(testData);
		m[hashKeyName] += '(shouldReturnItems-' + i + ')';
		items.push(m.save());
	}

	return expect(
		Promise.all(items).then(function() {
			return model.list();
		}).then(function(result) {
			return result.items;
		})
	).to.eventually.have.length.at.least(itemCount);
}

function testListShouldReturnItemsAfterContinuationToken(model, hashKeyName, testData, itemCount) {
	if (itemCount <= 10) {
		throw Error('itemCount must be greater than 10');
	}

	var items = [];
	for (var i = 0; i < itemCount; i++) {
		var m = model.create();
		m.set(testData);
		m[hashKeyName] += '(testListShouldReturnItemsAfterContinuationToken-' + i + ')';
		items.push(m.save());
	}

	return expect(
		Promise.all(items).then(function() {
			return model.list();
		}).then(function(result) {
			expect(result.items).to.have.length(10);
			expect(result.continuationToken).to.exist;
			return model.list({ continuationToken: result.continuationToken });
		}).then(function(result) {
			return result.items;
		})
	).to.eventually.have.length.at.least(itemCount - 10);
}

function testListShouldAllowSkippingToKey(model, hashKeyName, testData) {
	var items = [];
	for (var i = 0; i < 12; i++) {
		var m = model.create();
		m.set(testData);
		m[hashKeyName] += '(testListShouldAllowSkippingToKey-' + i + ')';
		items.push(m.save());
	}

	return expect(
		model.list().then(function(result) {
			expect(result.items).to.have.length(10);
			var last = result.items[result.items.length - 1];
			return model.list({ hashKeyVal: last.subject, rangeKeyVal: last.time });
		}).then(function(result) {
			return result.items;
		})
	).to.eventually.have.length.at.least(2);
}

module.exports = {
	// Helper functions for module loading
	loadExpect: loadExpect,
	loadDynamo: loadDynamo,

	// Operational helpers
	clearDb: clearDb,
	deleteStoredItem: deleteStoredItem,

	// Reusable tests for models
	testTableCreation: testTableCreation,
	testStoreObject: testStoreObject,
	testStoreOnEtagMatch: testStoreOnEtagMatch,
	testFailToStoreOnEtagMismatch: testFailToStoreOnEtagMismatch,
	testFailToLoadNonExistantItem: testFailToLoadNonExistantItem,
	testItemExistsReturnsTrueForExistingItem: testItemExistsReturnsTrueForExistingItem,
	testItemExistsReturnsFalseForNonExistentItem: testItemExistsReturnsFalseForNonExistentItem,
	testListReturnsNoItemsForEmptyTable: testListReturnsNoItemsForEmptyTable,
	testListShouldReturnItems: testListShouldReturnItems,
	testListShouldReturnItemsAfterContinuationToken: testListShouldReturnItemsAfterContinuationToken,
	testListShouldAllowSkippingToKey: testListShouldAllowSkippingToKey
};