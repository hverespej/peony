var Promise = require('bluebird');

exports.loadExpect = function() {
	var chai = require('chai');
	var chaiAsPromised = require('chai-as-promised');
	chai.use(chaiAsPromised);
	return chai.expect;
};

exports.loadDynamo = function() {
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
};

exports.clearDb = function(db) {
	return db.listTablesAsync({}).then(function(data) {
		var ops = [];
		data.TableNames.forEach(function(tn) {
			ops.push(db.deleteTableAsync({ TableName: tn }));
		});
		return Promise.all(ops);
	});
};
