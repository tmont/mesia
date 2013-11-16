module.exports = function(container) {
	var log = container.resolveSync('Logger');
	return function(err, req, res, next) {
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
					var view = '500';
					switch (res.statusCode) {
						case 403:
						case 404:
							view = res.statusCode.toString();
							break;
					}

					var errorRoutes = container.tryResolveSync('ErrorRoutes');
					var route = errorRoutes && errorRoutes[view];
					var locals = {
						pageCategory: 'error',
						info: route ? route.getInfo() : {
							title: 'NOPE.',
							description: 'NOPE.',
							type: 'website'
						}
					};
					res.render('errors/' + view, locals);
				} catch (e) {
					log.error('error rendering error view', e);
					res.send('NOPE.');
				}
				break;
		}
	};
};