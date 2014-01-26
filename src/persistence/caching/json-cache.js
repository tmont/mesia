/**
 * Decorator that can serialize JSON
 */
function JsonCache(/** CacheClient */client) {
	this.client = client;
}

JsonCache.prototype = {
	get: function(key, callback) {
		this.client.get(key, function(err, result) {
			if (err || !result) {
				callback(err);
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

	set: function(key, value, ttl, callback) {
		this.client.set(key, JSON.stringify(value), ttl, callback);
	},

	invalidate: function(key, callback) {
		this.client.invalidate(key, callback);
	}
};

module.exports = JsonCache;