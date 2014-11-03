exports.create = function(statusCode, code, msg, isInternal) {
	function toPublicError() {
		return {
			statusCode: 500,
			code: 'InternalError',
			msg: 'Internal Error'
		}
	}

	if (typeof(isInternal) === 'undefined') {
		isInternal = true;
	}

	if (typeof(code) !== 'string' ||
		typeof(statusCode) !== 'number' ||
		typeof(msg) !== 'string') {
		var err = new Error('Invalid parameters');
		err.code = 'InvalidParameters';
		err.statusCode = 400;
		err.isInternal = true;
		err.toPublicError = toPublicError;

		throw err;
	}

	var err = new Error(msg);
	err.statusCode = statusCode;
	err.code = code;
	err.isInternal = isInternal;
	err.toPublicError = toPublicError;

	return err;
}
