var _utils = require('../utils');
var _err = _utils.err;
var _dbi = require('./dbinterface');

var _db = null;
var _tableName = 'clients';
var _hashKeyName = 'userName';

function Client() {
}

Client.prototype.set = function(properties) {
	if (typeof(properties.userName) !== 'undefined') this.userName = properties.userName;
	if (typeof(properties.firstName) !== 'undefined') this.firstName = properties.firstName;
	if (typeof(properties.lastName) !== 'undefined') this.lastName = properties.lastName;
	if (typeof(properties.email) !== 'undefined') this.email = properties.email;
	if (typeof(properties.phone) !== 'undefined') this.phone = properties.phone;
	if (typeof(properties.profile) !== 'undefined') this.profile = properties.profile;
	if (typeof(properties.savedLocations) !== 'undefined') this.savedLocations = properties.savedLocations;
	if (typeof(properties.paymentInfo) !== 'undefined') this.paymentInfo = properties.paymentInfo;
	if (typeof(properties.appointments) !== 'undefined') this.appointments = properties.appointments;
	if (typeof(properties.joinedDate) !== 'undefined') this.joinedDate = properties.joinedDate;

	return this;
};

Client.prototype.load = function(options) {
	if (typeof(options.userName) !== 'string') {
		throw _err.create(400, 'InvalidProperty', 'Passed options must include userName');
	}

	var self = this;

	return _dbi.get({
		db: _db,
		tableName: _tableName,
		hashKeyName: _hashKeyName,
		hashKeyVal: options.userName
	}).then(function(serialized) {
		self.userName = serialized.userName.S;
		self.firstName = serialized.firstName.S;
		self.lastName = serialized.lastName.S;
		self.email = serialized.email.S;
		self.phone = serialized.phone.S;
		self.profile = serialized.profile.S;

		self.savedLocations = [];
		serialized.savedLocations.L.forEach(function(loc) {
			var deserializedLoc = {
				street: loc.M.street.S,
				city: loc.M.city.S,
				state: loc.M.state.S,
				zipcode: loc.M.zipcode.S
			};

			if (typeof(loc.M.unit) !== 'undefined') {
				deserializedLoc.unit = loc.M.unit;
			}

			self.savedLocations.push(deserializedLoc);
		});

		self.paymentInfo = serialized.paymentInfo.S;

		self.appointments = [];
		serialized.appointments.L.forEach(function(appt) {
			self.appointments.push(appt.S);
		});

		self.joinedDate = serialized.joinedDate.S;
		self.etag = serialized.etag.N;

		return self;
	});
};

Client.prototype.save = function() {
	if (typeof(this.userName) !== 'string' ||
		typeof(this.firstName) !== 'string' ||
		typeof(this.lastName) !== 'string' ||
		typeof(this.email) !== 'string' ||
		typeof(this.phone) !== 'string' ||
		typeof(this.profile) !== 'string' ||
		typeof(this.savedLocations) !== 'object' ||
		typeof(this.paymentInfo) !== 'string' ||
		typeof(this.appointments) !== 'object' ||
		typeof(this.joinedDate) !== 'string') {
		throw _err.create(400, 'InvalidProperty', 'One or more required property is invalid');
	}

	var serialized = {
		userName: { S: this.userName },
		firstName: { S: this.firstName },
		lastName: { S: this.lastName },
		email: { S: this.email },
		phone: { S: this.phone },
		profile: { S: this.profile },
		savedLocations: { L: [] },
		paymentInfo: { S: this.paymentInfo },
		appointments: { L: [] },
		joinedDate: { S: this.joinedDate }
	};

	this.savedLocations.forEach(function(loc) {
		var entry = {
			M: {
				street: { S: loc.street },
				city: { S: loc.city },
				state: { S: loc.state },
				zipcode: { S: loc.zipcode }
			}
		};
		if (typeof(loc.unit) !== 'undefined') {
			entry.M.unit = { S: loc.unit };
		}
		serialized.savedLocations.L.push(entry);
	});

	this.appointments.forEach(function(appt) {
		serialized.appointments.L.push({ S: appt });
	});

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
		return new Client();
	},
	list: function(options) {
		options = options || {};
		options.hashKeyName = _hashKeyName;
		return _dbi.list(_dbi.createListOptions(_db, _tableName, options));
	}
};
