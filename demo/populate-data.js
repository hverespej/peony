var Promise = require('bluebird');
var dynamo = loadDynamo();
var models = require('../models');
var client = models.client;
var provider = models.provider;

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

var sampleProvider = {
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

client.init(dynamo).then(function() {
	var c = client.create();
	c.set(sampleClient);
	return c.save();
}).then(function() {
	return provider.init(dynamo).then(function() {
		var p = provider.create();
		p.set(sampleProvider);
		return p.save();
	});
}).then(function() {
	console.log('Done');
});
