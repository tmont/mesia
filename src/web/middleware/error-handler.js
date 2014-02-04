module.exports = function(container) {
	var log = container.resolveSync('Logger');
	function sendErrorUsingController(req, res, route, callback) {
		if (!req.container) {
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

		app.middleware(params)(req, res, callback);
	}

	function sendErrorManually(err, req, res, route, view) {
		if (!err.status || err.status >= 500) {
			log.error(err);
		}

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
							res.send('');
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
		var view = '500';
		switch (res.statusCode) {
			case 403:
			case 404:
				view = res.statusCode.toString();
				break;
		}

		var errorRoutes = container.tryResolveSync('ErrorRoutes');
		var route = errorRoutes && errorRoutes[view];

		sendErrorUsingController(req, res, route, function(controllerError) {
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