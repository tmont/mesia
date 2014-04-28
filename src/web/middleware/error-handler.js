module.exports = function(container) {
	var log = container.resolveSync('Logger');
	function sendErrorUsingController(err, req, res, route, callback) {
		log.trace('attempting to send error using controller', err);
		if (!req.container || !route) {
			callback(true);
			return;
		}

		var app = req.container.tryResolveSync('App');
		if (!app) {
			callback(true);
			return;
		}

		var params = {
			controller: 'error',
			action: route.name
		};

		if (req.params) {
			req.params.isError = true;
		}
		app.middleware(params)(req, res, callback);
	}

	function sendErrorManually(err, req, res, route, view) {
		log.warn('attempting to send error manually', err);
		if (err.status || res.statusCode === 200) {
			res.status(err.status || 500);
		}

		switch (res.get('Content-Type')) {
			case 'application/json':
				res.send({ message: err.clientMessage || '' });
				break;
			default:
				try {
					var locals = {
						isError: true,
						info: route ? route.getInfo() : {
							title: 'NOPE.',
							description: 'NOPE.',
							type: 'website'
						}
					};
					res.render('errors/' + view, locals, function(err, str) {
						if (err) {
							log.error('Error rendering error view', err);
							res.status(503);
							res.send();
						} else {
							res.send(str);
						}
					});
				} catch (e) {
					log.error('error rendering error view', e);
					res.send('NOPE.');
				}
				break;
		}
	}

	return function(err, req, res, next) {
		log.trace('Express error handler');
		if (log.isDebugEnabled()) {
			//log all errors when in debug mode
			log.error(err);
		} else if (!err.status || err.status >= 500) {
			//only log server errors otherwise
			log.error(err);
		}

		var view = '500',
			status = err.status || res.statusCode;
		switch (status) {
			case 403:
			case 404:
				view = status.toString();
				break;
		}

		var errorRoutes = container.tryResolveSync('ErrorRoutes');
		var route = errorRoutes && errorRoutes[view];

		sendErrorUsingController(err, req, res, route, function(controllerError) {
			if (!controllerError) {
				return;
			}

			if (controllerError !== false) {
				log.error('Error rendering view using controller', controllerError);
			}

			sendErrorManually(err, req, res, route, view);
		});
	};
};