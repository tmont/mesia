function InMemoryCache() {
	this.items = {};
}

InMemoryCache.prototype = {
	get: function(key, callback) {
		var item = this.items[key] || {},
			miss = !(key in this.items);

		if (!miss && item.expiry.getTime() > Date.now()) {
			item = {};
			delete this.items[key];
		}

		process.nextTick(function() {
			callback(null, item.value);
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
	},

	invalidate: function(key, callback) {
		delete this.items[key];
		process.nextTick(callback);
	}
};

module.exports = InMemoryCache;