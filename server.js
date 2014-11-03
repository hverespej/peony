var Promise = require('bluebird');
var dynamo = loadDynamo();
var models = require('./models');
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

var express = require('express');
var server = express();

server.set('port', (process.env.PORT || 5000));
server.use(express.static(__dirname + '/public'));

server.get('/clients', function(req, res, next) {
	client.list().then(function(result) {
		res.send(result);
	}, function(err) {
		res.status(err.statusCode).send(err.message);
	}).finally(function() {
		next();
	});
});

server.get('/clients/:userId', function(req, res, next) {
	var c = client.create();
	c.load(req.params.userId).then(function() {
		res.send(c);
	}, function(err) {
		res.status(err.statusCode).send(err.message);
	}).finally(function() {
		next();
	});
});

server.get('/providers', function(req, res, next) {
	provider.list().then(function(result) {
		res.send(result);
	}, function(err) {
		res.status(err.statusCode).send(err.message);
	}).finally(function() {
		next();
	});
});

server.get('/providers/:userId', function(req, res, next) {
	var p = provider.create();
	p.load(req.params.userId).then(function() {
		res.send(p);
	}, function(err) {
		res.status(err.statusCode).send(err.message);
	}).finally(function() {
		next();
	});
});

Promise.all([client.init(dynamo), provider.init(dynamo)]).then(function() {
	server.listen(server.get('port'), function() {
		console.log('Server running on ' + server.get('port'));
	});
});
