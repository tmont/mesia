var SqlExecutor = require('../../persistence/sql-executor.js'),
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
					sql = container.resolveSync('Sql'),
					executor = new SqlExecutor(dbConn, log, sql);

				if (log.isDebugEnabled()) {
					executor.on('queried', function(data) {
						var query = data.query;
						if (typeof(data.query) !== 'string') {
							query = data.query.text + ' :: ' + util.inspect(data.query.values);
						}
						var header = data.name ? '\x1B[35m' + data.name + '\x1B[39m' : 'SQL';
						var message = header + '[' + data.elapsed + 'ms]\n' + '\x1B[34m' + query + '\x1B[39m';
						message += ' ' + '\x1B[33m' + data.summary + '\x1B[39m';
						log.debug(message);
					});
				}

				executor.on('queried', function(data) {
					if (data.elapsed > 100) {
						var query = data.query;
						if (typeof(data.query) !== 'string') {
							query = data.query.text + ' :: ' + util.inspect(data.query.values);
						}
						log.warn('Slow query (' + data.elapsed + 'ms)');
						log.warn('\x1B[34m' + query + '\x1B[39m');
					}
				});

				callback(null, executor);
			});
		}

		container.registerFactory(createQueryExecutor, key, sahara.lifetime.memory());
	};
};