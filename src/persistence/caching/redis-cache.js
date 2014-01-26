function logErrorAndCallback(log, callback) {
	return function(err) {
		err && log.error('Redis error', err);
		callback && callback.apply(null, arguments);
	}
}

function RedisCache(/** RedisClient */client, /** Logger */log) {
	this.client = client;
	this.log = log;
}

RedisCache.prototype = {
	get: function(key, callback) {
		this.client.get(key, logErrorAndCallback(this.log, callback));
	},

	set: function(key, value, ttl, callback) {
		if (typeof(ttl) === 'function') {
			callback = ttl;
			ttl = null;
		}

		if (typeof(ttl) === 'number') {
			ttl = parseInt(ttl);
		} else if (ttl instanceof Date) {
			ttl = (ttl.getTime() - Date.now()) / 1000
		} else {
			ttl = null;
		}

		ttl = ttl || 86400;
		if (ttl <= 0) {
			callback && callback(new Error('Invalid expiry, must be in the future'));
			return;
		}

		this.client.setex(key, ttl, value, logErrorAndCallback(this.log, callback));
	},

	invalidate: function(key, callback) {
		this.client.del(key, logErrorAndCallback(this.log, callback));
	}
};

module.exports = RedisCache;