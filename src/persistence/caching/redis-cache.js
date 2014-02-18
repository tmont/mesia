var async = require('async');

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

//TODO this whole object should be refactored to accept a cache set
//in addition to a cache key, so we can use hmget to do more efficient
//invalidation of multiple keys
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

		this.log.debug('setting cache value at \x1B[33m' + key + '\x1B[39m with ttl \x1B[33m' + ttl + '\x1B[39m');
		this.client.setex(key, ttl, value, logErrorAndCallback(this.log, callback));
	},

	invalidate: function(key, callback) {
		var wildcard = key.charAt(key.length - 1) === '*',
			self = this;

		function invalidate(key, next) {
			self.log.debug('invalidating cache key \x1B[33m' + key + '\x1B[39m');
			self.client.del(key, next);
		}

		if (wildcard) {
			this.client.keys(key, function(err, keys) {
				if (err) {
					callback(err);
					return;
				}

				async.each(keys, invalidate, logErrorAndCallback(self.log, callback));
			});
		} else {
			invalidate(key, logErrorAndCallback(this.log, callback));
		}
	}
};

module.exports = RedisCache;