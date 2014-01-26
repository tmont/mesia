var async = require('async');

function CacheInvalidator(/** CacheInvalidationMapping */map, /** CacheClient */client) {
	this.map = map;
	this.client = client;
}

CacheInvalidator.prototype = {
	invalidate: function(entity, callback) {
		var type = entity.constructor.name;
		if (!(type in this.map)) {
			callback && callback(null, { noMapping: true });
			return;
		}

		var keys = this.map[type](entity);
		if (!Array.isArray(keys)) {
			keys = [ keys ];
		}

		async.each(keys, this.client.invalidate.bind(this.client), function(err) {
			callback && callback(err, { invalidated: !err });
		});
	}
};

module.exports = CacheInvalidator;

