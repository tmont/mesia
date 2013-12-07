function InMemoryCache() {
	this.items = {};
}

InMemoryCache.prototype = {
	get: function(key, callback) {
		var value = this.items[key] || null,
			stats = {
				miss: !(key in this.items),
				expired: false
			};

		if (!stats.miss && value.expiry.getTime() > Date.now()) {
			stats.miss = true;
			stats.expired = true;
			value = null;
			delete this.items[key];
		}

		process.nextTick(function() {
			callback(null, value, stats);
		});
	},

	set: function(key, value, expiry, callback) {
		var item = this.items[key] = {
			value: value,
			expiry: expiry || new Date(Date.now() + 86400000)
		};

		if (callback) {
			process.nextTick(function() {
				callback(null, item);
			});
		}
	}
};

module.exports = InMemoryCache;