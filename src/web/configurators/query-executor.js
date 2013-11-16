var MySqlQueryExecutor = require('../../persistence/query-executor.js'),
	util = require('util');

module.exports = function(key, dbKey) {
	return function(container, libs) {
		var sahara = libs.sahara;

		function createQueryExecutor(container, callback) {
			if (!callback) {
				throw new Error(key + ' attempted to be resolved synchronously');
			}

			container.resolve(dbKey, function(err, dbConn) {
				if (err) {
					callback(err);
					return;
				}

				var log = container.resolveSync('Logger'),
					executor = new MySqlQueryExecutor(dbConn, log);

				if (log.isDebugEnabled()) {
					executor.on('queried', function(data) {
						var query = data.query;
						if (typeof(data.query) !== 'string') {
							query = data.query.text + ' :: ' + util.inspect(data.query.values);
						}
						var message = 'SQL[' + data.elapsed + 'ms]\n' + '\x1B[34m' + query + '\x1B[39m';
						log.debug(message);
					});
				}

				callback(null, executor);
			});
		}

		container.registerFactory(createQueryExecutor, key, sahara.lifetime.memory());
	};
};