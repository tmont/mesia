function RedisCache(/** RedisClient */client) {
	this.client = client;
}

RedisCache.prototype = {
	get: function(key, callback) {
		this.client.get(key, callback);
	},

	set: function(key, value, expiry, callback) {
		expiry = expiry || new Date(Date.now() + 86400000);
		var ttl = Math.round((expiry.getTime() - Date.now()) / 1000);
		if (ttl <= 0) {
			callback && callback({ message: 'Invalid expiry, must be in the future' });
			return;
		}

		this.client.setex(key, ttl, value, callback);
	},

	invalidate: function(key, callback) {
		this.client.del(key, callback);
	}
};

module.exports = RedisCache;