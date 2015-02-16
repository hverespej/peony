var Promise = require('bluebird');
var common = require('./testcommon');
var expect = common.loadExpect();
var dynamo = common.loadDynamo();
var service = require('../models').service;

describe('models/service', function() {
	var tableName = 'services';

	var testData = {
		name: 'manicure',
		friendlyName: 'Manicure',
		description: 'A 30-minute manicure. it\'s pretty nice!',
		price: '35',

		storageKey: function() {
			return { name: { S: this.name } };
		}
	};

	after(function(done) {
		return common.clearDb(dynamo).then(function() { done(); });
	});

	describe('#init', function() {
		before(function(done) {
			return common.clearDb(dynamo).then(function() { done(); });
		});

		it ('Should create table', function() {
			return common.testTableCreation(service, dynamo);
		});
	});

	describe('#create', function() {
		before(function(done) {
			return common.clearDb(dynamo).then(function() {
				return service.init(dynamo);
			}).then(function() { done(); });
		});

		describe('#', function() {
			it('Should return object', function() {
				expect(service.create()).to.exist;
			});
		});

		describe('#save', function() {
			afterEach(function(done) {
				return common.deleteStoredItem(dynamo, tableName, testData, done);
			});

			it('Should store object in DB', function() {
				return common.testStoreObject(service, testData, dynamo, tableName, function(retrieved) {
					return retrieved.Item.name.S === testData.name;
				});
			});

			it('Should store object in DB on etag match', function() {
				return common.testStoreOnEtagMatch(service, testData, dynamo, tableName);
			});

			it('Should fail to store object on etag mismatch', function() {
				return common.testFailToStoreOnEtagMismatch(service, testData);
			});
		});

		describe('#exists', function() {
			after(function(done) {
				return common.deleteStoredItem(dynamo, tableName, testData, done);
			});

			it('Should return true when item exists', function() {
				return common.testItemExistsReturnsTrueForExistingItem(service, testData, testData.name);
			});

			it('Should return false when item does not exist', function() {
				return common.testItemExistsReturnsFalseForNonExistentItem(service);
			});
		});

		describe('#load', function() {
			after(function(done) {
				return common.deleteStoredItem(dynamo, tableName, testData, done);
			});

			it('Should retrieve object with expected properties', function(done) {
				var s1 = service.create();
				var s2 = service.create();
				s1.set(testData);
				return s1.save().then(function() {
					return s2.load({ name: testData.name });
				}).then(function() {
					expect(s2.name).to.equal(s1.name);
					expect(s2.friendlyName).to.equal(s1.friendlyName);
					expect(s2.description).to.equal(s1.description);
					expect(s2.price).to.equal(s1.price);
					expect(s2.etag).to.exist;
					done();
				}).catch(function(err) {
					done(err);
				})
			});

			it('Should fail when loading non-existent object', function() {
				return common.testFailToLoadNonExistantItem(service, { name: 'non-existent' });
			});
		});
	});

	describe('#list', function() {
		beforeEach(function(done) {
			return common.clearDb(dynamo).then(function() {
				return service.init(dynamo);
			}).then(function() { done(); });
		});

		var hashKeyName = 'name';

		it('Should return no items for empty table', function() {
			return common.testListReturnsNoItemsForEmptyTable(service);
		});

		it('Should return items', function() {
			return common.testListShouldReturnItems(service, hashKeyName, testData, 2);
		});

		it ('Should return items after continuation token', function() {
			return common.testListShouldReturnItemsAfterContinuationToken(service, hashKeyName, testData, 12);
		});

		it('Should allow skipping to key', function() {
			return common.testListShouldAllowSkippingToKey(service, hashKeyName, testData);
		});
	});
});
