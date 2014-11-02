module.exports = function(obj) {
	var str = JSON.stringify(obj);

	// djb2 hash alg
	var hash = 5381;
	for (var i = 0; i < str.length; i++) {
		hash = ((hash << 5) + hash) + str.charCodeAt(i);
	}

	return hash >>> 0;
}
