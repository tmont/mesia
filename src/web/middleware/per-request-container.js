module.exports = function(container, libs) {
	var sahara = libs.sahara,
		configurators = container.tryResolveSync('PerRequestConfigurators'),
		log = container.resolveSync('Logger');

	return function(req, res, next) {
		log.trace('middleware: per-request');

		var childContainer = container.createChildContainer()
			.registerInstance(req, 'Request', sahara.lifetime.memory())
			.registerInstance(req, 'Response', sahara.lifetime.memory());

		if (configurators) {
			configurators.forEach(function(configurator) {
				configurator(childContainer, libs);
			});
		}

		req.container = childContainer;
		next();
	};
};