function RedisObjectCache(/** RedisCache */cache) {
	this.cache = cache;
}

RedisObjectCache.prototype = {
	get: function(key, callback) {
		this.cache.get(key, function(err, result) {
			if (err || !result) {
				callback(err || { notFound: true });
				return;
			}

			try {
				var value = JSON.parse(result);
				callback(null, value);
			} catch (e) {
				callback(e);
			}
		});
	},

	set: function(key, value, expiry, callback) {
		this.cache.set(key, JSON.stringify(value), expiry, callback);
	},

	invalidate: function(key, callback) {
		this.cache.invalidate(key, callback);
	}
};

module.exports = RedisObjectCache;