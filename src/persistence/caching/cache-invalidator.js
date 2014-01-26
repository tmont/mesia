function CacheInvalidator(/** CacheInvalidationMapping */map, /** CacheClient */client) {
	this.map = map;
	this.client = client;
}

CacheInvalidator.prototype = {
	invalidate: function(entity, callback) {
		var type = entity.constructor.name;
		if (!(type in this.map)) {
			callback(null, { noMapping: true });
			return;
		}

		var key = this.map[type](entity);

		this.client.invalidate(key, function(err) {
			callback(err, { invalidated: !err });
		});
	}
};

module.exports = CacheInvalidator;

