module.exports = function(cfg, key) {
	var connectedKey = key + 'Connected';
	return function(container, libs, next) {
		var mysql = libs.mysql,
			sahara = libs.sahara;

		function createMariaConnection(container, callback) {
			if (!callback) {
				throw new Error(key + ' attempted to be retrieved via synchronous call');
			}

			var log = container.resolveSync('Logger'),
				conn = mysql.createConnection({
					host: cfg.host,
					user: cfg.user,
					password: cfg.password,
					port: cfg.port,
					database: cfg.database
				});

			conn.connect(function(err) {
				if (err) {
					log.error('Failed to connect to MariaDB', err);
					callback(err);
					return;
				}

				log.debug('Connected to MariaDB using ' + cfg.user + '@' + cfg.host + ':' + cfg.port);
				container.registerInstance(true, connectedKey);
				callback(null, conn);
			});

			conn.on('error', function(err) {
				if (!err.fatal || err.code !== 'PROTOCOL_CONNECTION_LOST') {
					log.warn('Non-fatal MariaDB error occurred', err);
					return;
				}

				log.error('MariaDB disconnected or crashed, attempting to reconnect', err);
				createMariaConnection(container, function(err, conn) {
					//don't invoke callback
					if (err) {
						log.error('Unable to reconnect to MariaDB');
						process.exit(1);
					}

					log.info('Reconnected to MariaDB');
					//re-register and override the factory-based registration
					container.registerInstance(conn, key, sahara.lifetime.memory());
				});
			});
		}

		container.registerFactory(createMariaConnection, key, sahara.lifetime.memory());
		next();
	};
};