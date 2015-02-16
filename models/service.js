var _utils = require('../utils');
var _err = _utils.err;
var _dbi = require('./dbinterface');

var _db = null;
var _tableName = 'services';
var _hashKeyName = 'name';

function Service() {
}

// TODO: Add 'category' as proproty
Service.prototype.set = function(properties) {
	if (typeof(properties.name) !== 'undefined') this.name = properties.name;
	if (typeof(properties.friendlyName) !== 'undefined') this.friendlyName = properties.friendlyName;
	if (typeof(properties.description) !== 'undefined') this.description = properties.description;
	if (typeof(properties.price) !== 'undefined') this.price = properties.price;

	return this;
};

Service.prototype.load = function(options) {
	if (typeof(options.name) === 'undefined') {
		throw _err.create(400, 'InvalidProperty', 'Passed options must include name');
	}

	var self = this;

	return _dbi.get({
		db: _db,
		tableName: _tableName,
		hashKeyName: _hashKeyName,
		hashKeyVal: options.name
	}).then(function(serialized) {
		self.name = serialized.name.S;
		self.friendlyName = serialized.friendlyName.S;
		self.description = serialized.description.S;
		self.price = serialized.price.N;

		self.etag = serialized.etag.N;

		return self;
	});
};

Service.prototype.save = function() {
	if (typeof(this.name) !== 'string' ||
		typeof(this.friendlyName) !== 'string' ||
		typeof(this.description) !== 'string' ||
		typeof(this.price) !== 'string') {
		throw _err.create(400, 'InvalidProperty', 'One or more required property is invalid');
	}

	var serialized = {
		name: { S: this.name },
		friendlyName: { S: this.friendlyName },
		description: { S: this.description },
		price: { N: this.price }
	};

	if (typeof(this.etag) !== 'undefined') {
		serialized.etag = { N: this.etag };
	}

	return _dbi.save({
		db: _db,
		tableName: _tableName,
		hashKeyName: _hashKeyName,
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
			hashKeyName: _hashKeyName
		});
	},
	create: function() {
		return new Service();
	},
	exists: function(name) {
		return _dbi.itemExists({
			db: _db,
			tableName: _tableName,
			hashKeyName: _hashKeyName,
			hashKeyVal: name
		});
	},
	list: function(options) {
		options = options || {};
		options.hashKeyName = _hashKeyName;
		return _dbi.list(_dbi.createListOptions(_db, _tableName, options));
	}
};
