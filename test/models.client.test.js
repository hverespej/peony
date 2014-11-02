var Promise = require('bluebird');
var expect = loadExpect();
var dynamo = loadDynamo();
var client = require('../models').client;

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

describe('models/client', function() {

	after(function(done) {
		return clearDb().then(function() { done(); });
	});

	describe('#init', function() {
		before(function(done) {
			return clearDb().then(function() {
				return client.init(dynamo);
			}).then(function() { done(); });
		});

		it ('Should create table', function() {
			return expect(client.init(dynamo)).to.eventually.exist;
		});
	});

	describe('#create', function() {
		var testUserData = {
			userName: 'jm',
			firstName: 'John',
			lastName: 'Malkovich',
			email: 'john@not.really',
			phone: '555-555-5555',
			profile: 'Great actor',
			savedLocations: [],
			paymentInfo: 'fake',
			appointments: [],
			joinedDate: '2014-11-01T12:00:00.000Z'
		};

		before(function(done) {
			return clearDb().then(function() {
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
				return dynamo.deleteItemAsync({
					TableName: 'clients',
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
					TableName: 'clients',
					Key: { userName: { S: testUserData.userName } },
					ReturnConsumedCapacity: 'NONE',
					ReturnItemCollectionMetrics: 'NONE',
					ReturnValues: 'NONE'
				}).then(function() {
					done();
				});
			});

			it('Should store object in DB', function() {
				var c = client.create();
				c.set(testUserData);
				return expect(
					c.save().then(function() {
						return dynamo.getItemAsync({
							TableName: 'clients',
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
				var c = client.create();
				c.set(testUserData);
				return expect(
					c.save().then(function() {
						return dynamo.getItemAsync({
							TableName: 'clients',
							Key: { userName: { S: testUserData.userName } },
							ConsistentRead: true,
							ReturnConsumedCapacity: 'NONE'
						});
					}).then(function(retrieved) {
						return c.save();
					})
				).to.eventually.be.fulfilled;
			});

			it('Should fail to store object on etag mismatch', function() {
				var c = client.create();
				c.set(testUserData);
				return expect(
					c.save().then(function() {
						c.etag = '1';
						return c.save();
					})
				).to.eventually.be.rejectedWith(/^Conflict:/);
			});
		});

		describe('#load', function() {
			it('Should retrieve object with expected properties', function() {
				var c1 = client.create();
				var c2 = client.create();
				c1.set(testUserData);
				return expect(
					c1.save().then(function() {
						return c2.load(testUserData.userName);
					}).then(function() {
						expect(
							c2.userName === c1.userName && 
							c2.firstName === c1.firstName &&
							c2.lastName === c1.lastName &&
							c2.email === c1.email &&
							c2.phone === c1.phone &&
							c2.profile === c1.profile &&
							c2.savedLocations === c1.savedLocations &&
							c2.paymentInfo === c1.paymentInfo &&
							c2.appointments === c1.appointments &&
							c2.joinedDate === c1.joinedDate &&
							typeof(c2.etag) !== 'undefined'
						).to.be.true;
					})
				).to.eventually.be.resolved;
			});

			it('Should fail when loading non-existent object', function() {
				var c = client.create();
				return expect(
					c.load('doesNotExist')
				).to.eventually.be.rejectedWith(/^Not Found$/);
			});
		});
	});

	describe('#list', function() {
		it('!Is not yet implemented!', function() {
			expect(client.list).to.throw(/^Not Implemented$/);
		});
	});
});

function clearDb() {
	return dynamo.listTablesAsync({}).then(function(data) {
		var ops = [];
		data.TableNames.forEach(function(tn) {
			ops.push(dynamo.deleteTableAsync({ TableName: tn }));
		});
		return Promise.all(ops);
	});
}
