function logError(log) {
	return function(err) {
		err && log.error('Redis error', err);
	}
}

function RedisCache(/** RedisClient */client, /** Logger */log) {
	this.client = client;
	this.log = log;
}

RedisCache.prototype = {
	get: function(key, callback) {
		this.client.get(key, callback || logError(this.log));
	},

	set: function(key, value, expiry, callback) {
		expiry = expiry || new Date(Date.now() + 86400000);
		var ttl = Math.round((expiry.getTime() - Date.now()) / 1000);
		if (ttl <= 0) {
			callback && callback({ message: 'Invalid expiry, must be in the future' });
			return;
		}

		this.client.setex(key, ttl, value, callback || logError(this.log));
	},

	invalidate: function(key, callback) {
		this.client.del(key, callback || logError(this.log));
	}
};

module.exports = RedisCache;