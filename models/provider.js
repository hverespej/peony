/*var _dynamoClient = null;

function get(providerId) {
	// Table should exist
	// Retrieve object from table

	return {
		name: '',
		email: '',
		phone: '',
		shortSummary: '',
		fullSummary: '',
		quote: '',
		education: '',
		accreditation: '',
		photo: '',
		servicesOffered: [],
		locationsServed: [],
		availability: [],
		appointments: [],

		save: function() { updateDb(this); }
	};
}

function updateDb(obj) {
	// Table should exist
	// Save object to table
}

module.exports = function(dynamoClient) {
	if (!dynamoClient) {
		throw new Error('Must provide dynamoClient');
	}
	_dynamoClient = dynamoClient;

	return {
		get: get
	};
};
*/