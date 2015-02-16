var Promise = require('bluebird');
var common = require('./testcommon');
var expect = common.loadExpect();
var dynamo = common.loadDynamo();
var review = require('../models').review;

describe('models/review', function() {
	var tableName = 'reviews';

	var testData = {
		subject: 'fakeusername-provider',
		time: '2014-12-01T12:00:00.000Z',
		reviewer: 'fakeusername-client',
		rating: '5',
		description: 'Great service - very friendly, yet professional',

		storageKey: function() {
			return {
				subject: { S: this.subject },
				time: { S: this.time }
			};
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
			return common.testTableCreation(review, dynamo);
		});
	});

	describe('#create', function() {
		before(function(done) {
			return common.clearDb(dynamo).then(function() {
				return review.init(dynamo);
			}).then(function() { done(); });
		});

		describe('#', function() {
			it('Should return object', function() {
				expect(review.create()).to.exist;
			});
		});

		describe('#save', function() {
			afterEach(function(done) {
				return common.deleteStoredItem(dynamo, tableName, testData, done);
			});

			it('Should store object in DB', function() {
				return common.testStoreObject(review, testData, dynamo, tableName, function(retrieved) {
					return retrieved.Item.subject.S === testData.subject &&
						retrieved.Item.time.S === testData.time;
				});
			});

			it('Should store object in DB on etag match', function() {
				return common.testStoreOnEtagMatch(review, testData, dynamo, tableName);
			});

			it('Should fail to store object on etag mismatch', function() {
				return common.testFailToStoreOnEtagMismatch(review, testData);
			});
		});

		describe('#exists', function() {
			after(function(done) {
				return common.deleteStoredItem(dynamo, tableName, testData, done);
			});

			it('Should return true when item exists', function() {
				return common.testItemExistsReturnsTrueForExistingItem(review, testData, testData.subject, testData.time);
			});

			it('Should return false when item does not exist', function() {
				return common.testItemExistsReturnsFalseForNonExistentItem(review);
			});
		});

		describe('#load', function() {
			after(function(done) {
				return common.deleteStoredItem(dynamo, tableName, testData, done);
			});

			it('Should retrieve object with expected properties', function(done) {
				var r1 = review.create();
				var r2 = review.create();
				r1.set(testData);
				return r1.save().then(function() {
					return r2.load({ subject: testData.subject, time: testData.time });
				}).then(function() {
					expect(r2.subject).to.equal(r1.subject);
					expect(r2.time).to.equal(r1.time);
					expect(r2.reviewer).to.equal(r1.reviewer);
					expect(r2.rating).to.equal(r1.rating);
					expect(r2.description).to.equal(r1.description);
					expect(r2.etag).to.exist;
					done();
				}).catch(function(err) {
					done(err);
				})
			});

			it('Should fail when loading non-existent object', function() {
				return common.testFailToLoadNonExistantItem(review, {
					subject: 'non-existent',
					time: '2014-12-01T12:00:00.000Z'
				});
			});
		});
	});

	describe('#list', function() {
		beforeEach(function(done) {
			return common.clearDb(dynamo).then(function() {
				return review.init(dynamo);
			}).then(function() { done(); });
		});

		var hashKeyName = 'subject';

		it('Should return no items for empty table', function() {
			return common.testListReturnsNoItemsForEmptyTable(review);
		});

		it('Should return items', function() {
			return common.testListShouldReturnItems(review, hashKeyName, testData, 2);
		});

		it ('Should return items after continuation token', function() {
			return common.testListShouldReturnItemsAfterContinuationToken(review, hashKeyName, testData, 12);
		});

		it('Should allow skipping to key', function() {
			return common.testListShouldAllowSkippingToKey(review, hashKeyName, testData);
		});
	});
});
