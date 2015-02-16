var Promise = require('bluebird');
var common = require('./testcommon');
var expect = common.loadExpect();
var dynamo = common.loadDynamo();
var provider = require('../models').provider;

describe('models/provider', function() {
	var tableName = 'providers';

	var testData = {
		userName: 'cw',
		firstName: 'Christopher',
		lastName: 'Walken',
		email: 'christopher@not.really',
		phone: '555-555-5555',
		profile: {
			shortSummary: 'Great actor',
			fullSummary: 'Great actor and nail tech',
			quote: 'At its best, life is completely unpredictable.',
			education: 'Fake Institute of Nails',
			accreditation: 'Licensed Nail Technician in Washington State',
			photo: 'http://a3.files.biography.com/image/upload/c_fill,dpr_1.0,g_face,h_300,q_80,w_300/MTIwNjA4NjM0MDAwNjcyMjY4.jpg'
		},
		paymentInfo: 'fake',
		servicesOffered: [],
		locationsServed: [],
		availability: [],
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
			return common.testTableCreation(provider, dynamo);
		});
	});

	describe('#create', function() {
		before(function(done) {
			return common.clearDb(dynamo).then(function() {
				return provider.init(dynamo);
			}).then(function() { done(); });
		});

		describe('#', function() {
			it('Should return object', function() {
				expect(provider.create()).to.exist;
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
				return common.testStoreObject(provider, testData, dynamo, tableName, function(retrieved) {
					return retrieved.Item.userName.S === testData.userName;
				});
			});

			it('Should store object in DB on etag match', function() {
				return common.testStoreOnEtagMatch(provider, testData, dynamo, tableName);
			});

			it('Should fail to store object on etag mismatch', function() {
				return common.testFailToStoreOnEtagMismatch(provider, testData);
			});
		});

		describe('#exists', function() {
			after(function(done) {
				return common.deleteStoredItem(dynamo, tableName, testData, done);
			});

			it('Should return true when item exists', function() {
				return common.testItemExistsReturnsTrueForExistingItem(provider, testData, testData.userName);
			});

			it('Should return false when item does not exist', function() {
				return common.testItemExistsReturnsFalseForNonExistentItem(provider);
			});
		});

		describe('#load', function() {
			it('Should retrieve object with expected properties', function(done) {
				var p1 = provider.create();
				var p2 = provider.create();
				p1.set(testData);
				return p1.save().then(function() {
					return p2.load({ userName: testData.userName });
				}).then(function() {
					expect(p2.userName).to.equal(p1.userName);
					expect(p2.firstName).to.equal(p1.firstName);
					expect(p2.lastName).to.equal(p1.lastName);
					expect(p2.email).to.equal(p1.email);
					expect(p2.phone).to.equal(p1.phone);
					expect(p2.profile.shortSummary).to.equal(p1.profile.shortSummary);
					expect(p2.profile.fullSummary).to.equal(p1.profile.fullSummary);
					expect(p2.profile.quote).to.equal(p1.profile.quote);
					expect(p2.profile.education).to.equal(p1.profile.education);
					expect(p2.profile.accreditation).to.equal(p1.profile.accreditation);
					expect(p2.profile.photo).to.equal(p1.profile.photo);
					expect(p2.paymentInfo).to.equal(p1.paymentInfo);
					expect(p2.servicesOffered).to.deep.equal(p1.servicesOffered);
					expect(p2.locationsServed).to.deep.equal(p1.locationsServed);
					expect(p2.availability).to.deep.equal(p1.availability);
					expect(p2.appointments).to.deep.equal(p1.appointments);
					expect(p2.joinedDate).to.equal(p1.joinedDate);
					expect(p2.etag).to.exist;
					done();
				}).catch(function(err) {
					done(err);
				})
			});

			it('Should fail when loading non-existent object', function() {
				return common.testFailToLoadNonExistantItem(provider, { userName: 'non-existent' });
			});
		});
	});

	describe('#list', function() {
		beforeEach(function(done) {
			return common.clearDb(dynamo).then(function() {
				return provider.init(dynamo);
			}).then(function() { done(); });
		});

		var hashKeyName = 'userName';

		it('Should return no items for empty table', function() {
			return common.testListReturnsNoItemsForEmptyTable(provider);
		});

		it('Should return items', function() {
			return common.testListShouldReturnItems(provider, hashKeyName, testData, 2);
		});

		it ('Should return items after continuation token', function() {
			return common.testListShouldReturnItemsAfterContinuationToken(provider, hashKeyName, testData, 12);
		});

		it('Should allow skipping to key', function() {
			return common.testListShouldAllowSkippingToKey(provider, hashKeyName, testData);
		});
	});
});
