var Promise = require('bluebird');
var dynamo = loadDynamo();
var client = require('../models').client;

function loadDynamo() {
	var aws = require('aws-sdk');
	aws.config.update({
		apiVersion: '2014-11-01',
		accessKeyId: 'fake',
		secretAccessKey: 'fake',
		region: 'us-west-2'
	});

	var dynamo = new aws.DynamoDB({ endpoint: 'http://localhost:8000' });
	Promise.promisifyAll(dynamo);
	return dynamo;
}

var sampleClient = {
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

client.init(dynamo).then(function() {
	var c = client.create();
	c.set(sampleClient);
	return c.save();
}).then(function() {
	console.log('Done');
})
