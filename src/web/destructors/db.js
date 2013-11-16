module.exports = function(key) {
	return function(container, callback) {
		var log = container.resolveSync('Logger'),
			isConnected = container.tryResolveSync(key + 'Connected');

		if (!isConnected) {
			process.nextTick(callback);
			return;
		}

		container.resolve(key, function(err, conn) {
			if (err) {
				callback(err);
				return;
			}

			conn.end(function(err) {
				if (!err) {
					log.debug('Database connection closed (' + key + ')');
					container.registerInstance(false, 'DbConnected');
				}
				callback(err);
			});
		});
	};
};