module.exports = function(executorKey, key) {
	return function(container, libs, next) {
		var log = container.resolveSync('Logger');

		function interceptor(context, next) {
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

					next(function(done) {
						if (context.error) {
							executor.execute('ROLLBACK', function(err) {
								if (err) {
									if (!context.error) {
										context.error = err;
									}
									log.error('Error during rollback', err);
								}

								done();
							});
							return;
						}

						executor.execute('COMMIT', function(err) {
							if (err) {
								if (!context.error) {
									context.error = err;
								}
								log.error('Error committing transaction', err);
							}

							done();
						});
					});
				});
			});
		}

		container.registerInstance(interceptor, key || 'TxInterceptor');
		next();
	};
};