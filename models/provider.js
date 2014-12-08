var _utils = require('../utils');
var _err = _utils.err;
var _dbi = require('./dbinterface');

var _db = null;
var _tableName = 'providers';
var _hashKeyName = 'userName';

function Provider() {
}

Provider.prototype.set = function(properties) {
	if (typeof(properties.userName) !== 'undefined') this.userName = properties.userName;
	if (typeof(properties.firstName) !== 'undefined') this.firstName = properties.firstName;
	if (typeof(properties.lastName) !== 'undefined') this.lastName = properties.lastName;
	if (typeof(properties.email) !== 'undefined') this.email = properties.email;
	if (typeof(properties.phone) !== 'undefined') this.phone = properties.phone;
	if (typeof(properties.profile) !== 'undefined') this.profile = properties.profile;
	if (typeof(properties.paymentInfo) !== 'undefined') this.paymentInfo = properties.paymentInfo;
	if (typeof(properties.servicesOffered) !== 'undefined') this.servicesOffered = properties.servicesOffered;
	if (typeof(properties.locationsServed) !== 'undefined') this.locationsServed = properties.locationsServed;
	if (typeof(properties.availability) !== 'undefined') this.availability = properties.availability;
	if (typeof(properties.appointments) !== 'undefined') this.appointments = properties.appointments;
	if (typeof(properties.joinedDate) !== 'undefined') this.joinedDate = properties.joinedDate;

	return this;
};

Provider.prototype.load = function(options) {
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

		self.profile = {};
		self.profile.shortSummary = serialized.profile.M.shortSummary.S;
		self.profile.fullSummary = serialized.profile.M.fullSummary.S;
		self.profile.quote = serialized.profile.M.quote.S;
		self.profile.education = serialized.profile.M.education.S;
		self.profile.accreditation = serialized.profile.M.accreditation.S;
		self.profile.photo = serialized.profile.M.photo.S;

		self.paymentInfo = serialized.paymentInfo.S;

		self.servicesOffered = [];
		serialized.servicesOffered.L.forEach(function(svc) {
			self.servicesOffered.push(svc.S);
		});

		self.locationsServed = [];
		serialized.locationsServed.L.forEach(function(loc) {
			self.locationsServed.push(loc.S);
		});

		self.availability = [];
		serialized.availability.L.forEach(function(avl) {
			self.availability.push(avl.S);
		});

		self.appointments = [];
		serialized.appointments.L.forEach(function(appt) {
			self.appointments.push(appt.S);
		});

		self.joinedDate = serialized.joinedDate.S;
		self.etag = serialized.etag.N;

		return self;
	});
};

Provider.prototype.save = function() {
	if (typeof(this.userName) !== 'string' ||
		typeof(this.firstName) !== 'string' ||
		typeof(this.lastName) !== 'string' ||
		typeof(this.email) !== 'string' ||
		typeof(this.phone) !== 'string' ||
		typeof(this.profile) !== 'object' ||
		typeof(this.paymentInfo) !== 'string' ||
		typeof(this.servicesOffered) !== 'object' ||
		typeof(this.locationsServed) !== 'object' ||
		typeof(this.availability) !== 'object' ||
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
		profile: { M: {} },
		paymentInfo: { S: this.paymentInfo },
		servicesOffered: { L: [] },
		locationsServed: { L: [] },
		availability: { L: [] },
		appointments: { L: [] },
		joinedDate: { S: this.joinedDate }
	};

	serialized.profile.M.shortSummary = { S: this.profile.shortSummary };
	serialized.profile.M.fullSummary = { S: this.profile.fullSummary };
	serialized.profile.M.quote = { S: this.profile.quote };
	serialized.profile.M.education = { S: this.profile.education };
	serialized.profile.M.accreditation = { S: this.profile.accreditation };
	serialized.profile.M.photo = { S: this.profile.photo };

	this.servicesOffered.forEach(function(svc) {
		serialized.servicesOffered.L.push(svc);
	});

	this.locationsServed.forEach(function(loc) {
		serialized.locationsServed.L.push(loc);
	});

	this.availability.forEach(function(avl) {
		serialized.availability.L.push(avl);
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
		return new Provider();
	},
	list: function(options) {
		options = options || {};
		options.hashKeyName = _hashKeyName;
		return _dbi.list(_dbi.createListOptions(_db, _tableName, options));
	}
};
