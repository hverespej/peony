var Promise = require('bluebird');
var common = require('./testcommon');
var expect = common.loadExpect();
var dynamo = common.loadDynamo();
var client = require('../models').client;

describe('models/client', function() {
	var tableName = 'clients';

	var testData = {
		userName: 'jm',
		firstName: 'John',
		lastName: 'Malkovich',
		email: 'john@not.really',
		phone: '555-555-5555',
		profile: 'Great actor',
		savedLocations: [],
		paymentInfo: 'fake',
		appointments: [],
		joinedDate: '2014-11-01T12:00:00.000Z',

		storageKey: function() {
			return { userName: { S: this.userName } };
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
			return common.testTableCreation(client, dynamo);
		});
	});

	describe('#create', function() {
		before(function(done) {
			return common.clearDb(dynamo).then(function() {
				return client.init(dynamo);
			}).then(function() { done(); });
		});

		describe('#', function() {
			it('Should return object', function() {
				expect(client.create()).to.exist;
			});
		});

		describe('#save', function() {
			beforeEach(function(done) {
				return common.deleteStoredItem(dynamo, tableName, testData, done);
			});

			after(function(done) {
				return common.deleteStoredItem(dynamo, tableName, testData, done);
			});

			it('Should store object in DB', function() {
				return common.testStoreObject(client, testData, dynamo, tableName, function(retrieved) {
					return retrieved.Item.userName.S === testData.userName;
				});
			});

			it('Should store object in DB on etag match', function() {
				return common.testStoreOnEtagMatch(client, testData, dynamo, tableName);
			});

			it('Should fail to store object on etag mismatch', function() {
				return common.testFailToStoreOnEtagMismatch(client, testData);
			});
		});

		describe('#load', function() {
			it('Should retrieve object with expected properties', function(done) {
				var c1 = client.create();
				var c2 = client.create();
				c1.set(testData);
				return c1.save().then(function() {
					return c2.load({ userName: testData.userName });
				}).then(function() {
					expect(c2.userName).to.equal(c1.userName);
					expect(c2.firstName).to.equal(c1.firstName);
					expect(c2.lastName).to.equal(c1.lastName);
					expect(c2.email).to.equal(c1.email);
					expect(c2.phone).to.equal(c1.phone);
					expect(c2.profile).to.equal(c1.profile);
					expect(c2.savedLocations).to.deep.equal(c1.savedLocations);
					expect(c2.paymentInfo).to.equal(c1.paymentInfo);
					expect(c2.appointments).to.deep.equal(c1.appointments);
					expect(c2.joinedDate).to.equal(c1.joinedDate);
					expect(c2.etag).to.exist;
					done();
				}).catch(function(err) {
					done(err);
				});
			});

			it('Should fail when loading non-existent object', function() {
				return common.testFailToLoadNonExistantItem(client, { userName: 'non-existent' });
			});
		});
	});

	describe('#list', function() {
		beforeEach(function(done) {
			return common.clearDb(dynamo).then(function() {
				return client.init(dynamo);
			}).then(function() { done(); });
		});

		var hashKeyName = 'userName';

		it('Should return no items for empty table', function() {
			return common.testListReturnsNoItemsForEmptyTable(client);
		});

		it('Should return items', function() {
			return common.testListShouldReturnItems(client, hashKeyName, testData, 2);
		});

		it ('Should return items after continuation token', function() {
			return common.testListShouldReturnItemsAfterContinuationToken(client, hashKeyName, testData, 12);
		});

		it('Should allow skipping to key', function() {
			return common.testListShouldAllowSkippingToKey(client, hashKeyName, testData);
		});
	});
});
