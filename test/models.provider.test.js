var Promise = require('bluebird');
var common = require('./testcommon');
var expect = common.loadExpect();
var dynamo = common.loadDynamo();
var provider = require('../models').provider;

describe('models/provider', function() {
	var tableName = 'providers';

	after(function(done) {
		return common.clearDb(dynamo).then(function() { done(); });
	});

	describe('#init', function() {
		before(function(done) {
			return common.clearDb(dynamo).then(function() { done(); });
		});

		it ('Should create table', function() {
			return expect(
				provider.init(dynamo).then(function() {
					return dynamo.listTablesAsync({});
				}).then(function(data) {
					return data.TableNames.length;
				})
			).to.eventually.equal(1);
		});
	});

	describe('#create', function() {
		var testUserData = {
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
			joinedDate: '2014-11-01T12:00:00.000Z'
		};

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
				return dynamo.deleteItemAsync({
					TableName: tableName,
					Key: { userName: { S: testUserData.userName } },
					ReturnConsumedCapacity: 'NONE',
					ReturnItemCollectionMetrics: 'NONE',
					ReturnValues: 'NONE'
				}).then(function() {
					done();
				});
			});

			after(function(done) {
				return dynamo.deleteItemAsync({
					TableName: tableName,
					Key: { userName: { S: testUserData.userName } },
					ReturnConsumedCapacity: 'NONE',
					ReturnItemCollectionMetrics: 'NONE',
					ReturnValues: 'NONE'
				}).then(function() {
					done();
				});
			});

			it('Should store object in DB', function() {
				var p = provider.create();
				p.set(testUserData);
				return expect(
					p.save().then(function() {
						return dynamo.getItemAsync({
							TableName: tableName,
							Key: { userName: { S: testUserData.userName } },
							ConsistentRead: true,
							ReturnConsumedCapacity: 'NONE'
						});
					}).then(function(retrieved) {
						return retrieved.Item.userName.S;
					})
				).to.eventually.equal(testUserData.userName);
			});

			it('Should store object in DB on etag match', function() {
				var p = provider.create();
				p.set(testUserData);
				return expect(
					p.save().then(function() {
						return dynamo.getItemAsync({
							TableName: tableName,
							Key: { userName: { S: testUserData.userName } },
							ConsistentRead: true,
							ReturnConsumedCapacity: 'NONE'
						});
					}).then(function(retrieved) {
						return p.save();
					})
				).to.eventually.be.fulfilled;
			});

			it('Should fail to store object on etag mismatch', function() {
				var p = provider.create();
				p.set(testUserData);
				return expect(
					p.save().then(function() {
						p.etag = '1';
						return p.save();
					})
				).to.eventually.be.rejectedWith(/^Conflict:/);
			});
		});

		describe('#load', function() {
			it('Should retrieve object with expected properties', function(done) {
				var p1 = provider.create();
				var p2 = provider.create();
				p1.set(testUserData);
				return p1.save().then(function() {
					return p2.load(testUserData.userName);
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
				var p = provider.create();
				return expect(
					p.load('doesNotExist')
				).to.eventually.be.rejectedWith(/^Not Found$/);
			});
		});
	});

	describe('#list', function() {
		it('!Is not yet implemented!', function() {
			expect(provider.list).to.throw(/^Not Implemented$/);
		});
	});
});
