var _utils = require('../utils');
var _err = _utils.err;
var _dbi = require('./dbinterface');

var _db = null;
var _tableName = 'reviews';
var _hashKeyName = 'subject';
var _rangeKeyName = 'time';

function Review() {
}

Review.prototype.set = function(properties) {
	if (typeof(properties.subject) !== 'undefined') this.subject = properties.subject;
	if (typeof(properties.time) !== 'undefined') this.time = properties.time;
	if (typeof(properties.reviewer) !== 'undefined') this.reviewer = properties.reviewer;
	if (typeof(properties.rating) !== 'undefined') this.rating = properties.rating;
	if (typeof(properties.description) !== 'undefined') this.description = properties.description;

	return this;
};

Review.prototype.load = function(options) {
	if (typeof(options.subject) !== 'string' ||
		typeof(options.time) !== 'string') {
		throw _err.create(400, 'InvalidProperty', 'Passed options must include subject and time');
	}

	var self = this;

	return _dbi.get({
		db: _db,
		tableName: _tableName,
		hashKeyName: _hashKeyName,
		hashKeyVal: options.subject,
		rangeKeyName: _rangeKeyName,
		rangeKeyVal: options.time
	}).then(function(serialized) {
		self.subject = serialized.subject.S;
		self.time = serialized.time.S;
		self.reviewer = serialized.reviewer.S;
		self.rating = serialized.rating.S;
		self.description = serialized.description.S;

		self.etag = serialized.etag.N;

		return self;
	});
};

Review.prototype.save = function() {
	if (typeof(this.subject) !== 'string' ||
		typeof(this.time) !== 'string' ||
		typeof(this.reviewer) !== 'string' ||
		typeof(this.rating) !== 'string' ||
		typeof(this.description) !== 'string') {
		throw _err.create(400, 'InvalidProperty', 'One or more required property is invalid');
	}

	var serialized = {
		subject: { S: this.subject },
		time: { S: this.time },
		reviewer: { S: this.reviewer },
		rating: { S: this.rating },
		description: { S: this.description }
	};

	if (typeof(this.etag) !== 'undefined') {
		serialized.etag = { N: this.etag };
	}

	return _dbi.save({
		db: _db,
		tableName: _tableName,
		hashKeyName: _hashKeyName,
		rangeKeyName: _rangeKeyName,
		serialized: serialized
	});
};

module.exports = {
	init: function(db) {
		if (!db) {
			throw new Error('Must provide db');
		}
		_db = db;
		return _dbi.createCollectionIfNotExists({
			db: _db,
			tableName: _tableName,
			hashKeyName: _hashKeyName,
			rangeKeyName: _rangeKeyName
		});
	},
	create: function() {
		return new Review();
	},
	exists: function(subject, time) {
		return _dbi.itemExists({
			db: _db,
			tableName: _tableName,
			hashKeyName: _hashKeyName,
			hashKeyVal: subject,
			rangeKeyName: _rangeKeyName,
			rangeKeyVal: time
		});
	},
	list: function(options) {
		options = options || {};
		options.hashKeyName = _hashKeyName;
		options.rangeKeyName = _rangeKeyName;
		return _dbi.list(_dbi.createListOptions(_db, _tableName, options));
	}
};
