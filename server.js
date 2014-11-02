var Promise = require('bluebird');
var dynamo = loadDynamo();
var client = require('./models').client;

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

var express = require('express');
var server = express();

server.set('port', (process.env.PORT || 5000));
server.use(express.static(__dirname + '/public'));

server.get('/users', function(req, res, next) {
	client.list(req.params.userId).then(function(result) {
		res.send(result);
	}, function(err) {
		res.status(err.statusCode).send(err.message);
	}).finally(function() {
		next();
	});
});

server.get('/users/:userId', function(req, res, next) {
	var c = client.create();
	c.load(req.params.userId).then(function() {
		res.send(c);
	}, function(err) {
		res.status(err.statusCode).send(err.message);
	}).finally(function() {
		next();
	});
});

client.init(dynamo).then(function() {
	server.listen(server.get('port'), function() {
		console.log('Server running on ' + server.get('port'));
	});
});
