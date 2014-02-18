var async = require('async');

function CacheInvalidator(/** CacheInvalidationMapping */map, /** CacheClient */client) {
	this.map = map;
	this.client = client;
}

CacheInvalidator.prototype = {
	getKeys: function(key, args) {
		var mapping = this.map[key];
		if (!mapping) {
			return [];
		}

		var keys = mapping.keys.apply(this.map, args);
		var dependents = mapping.dependents || [];
		for (var i = 0; i < dependents.length; i++) {
			[].push.apply(keys, this.getKeys(dependents[i], args));
		}

		return keys;
	},

	invalidate: function(entity, callback) {
		var args = [].slice.call(arguments),
			hasCallback = true;

		callback = args[args.length - 1];

		if (typeof(callback) !== 'function') {
			callback = function() {};
			hasCallback = false;
		}

		var type = entity.constructor.name;
		var mapping = this.map[type];
		if (!mapping) {
			callback(null, { noMapping: true });
			return;
		}

		var keys = this.getKeys(type, hasCallback ? args.slice(0, -1) : args),
			invalidated = {};

		var self = this;
		function invalidateUniqueKeys(key, next) {
			if (invalidated[key]) {
				next();
				return;
			}

			invalidated[key] = 1;
			self.client.invalidate(key, next);
		}

		async.each(keys, invalidateUniqueKeys, function(err) {
			callback(err, { invalidated: !err });
		});
	}
};

module.exports = CacheInvalidator;

