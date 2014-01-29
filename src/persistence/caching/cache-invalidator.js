var async = require('async');

function CacheInvalidator(/** CacheInvalidationMapping */map, /** CacheClient */client) {
	this.map = map;
	this.client = client;
}

CacheInvalidator.prototype = {
	invalidate: function(entity, callback) {
		var args = [].slice.call(arguments),
			hasCallback = true;

		callback = args[args.length - 1];

		if (typeof(callback) !== 'function') {
			callback = function() {};
			hasCallback = false;
		}

		var type = entity.constructor.name;
		if (!(type in this.map)) {
			callback(null, { noMapping: true });
			return;
		}

		var mapArgs = hasCallback ? args.slice(0, -1) : args;

		var keys = this.map[type].apply(this.map, mapArgs);
		if (!Array.isArray(keys)) {
			keys = [ keys ];
		}

		async.each(keys, this.client.invalidate.bind(this.client), function(err) {
			callback(err, { invalidated: !err });
		});
	}
};

module.exports = CacheInvalidator;

