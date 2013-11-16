module.exports = function(executorKey, key) {
	return function(container, libs) {
		var log = container.resolveSync('Logger');

		function createInterceptor(container) {
			return function(context, next) {
				container.resolve(executorKey, function(err, executor) {
					if (err) {
						context.error = err;
						next();
						return;
					}

					executor.execute('START TRANSACTION', function(err) {
						if (err) {
							context.error = err;
							next();
							return;
						}

						next(function() {
							if (context.error) {
								executor.execute('ROLLBACK', function(err) {
									err && log.error('Error during rollback', err);
								});
								return;
							}

							executor.execute('COMMIT', function(err) {
								err && log.error('Error committing transaction', err);
							});
						});
					});
				});
			};
		}

		container.registerFactory(createInterceptor, key || 'TxInterceptor');
	};
};