module.exports = function(container, libs) {
	var sahara = libs.sahara,
		log = container.resolveSync('Logger');

	return function(req, res, next) {
		log.trace('middleware: per-request');

		req.container = container
			.createChildContainer(true)
			.registerInstance(req, 'Request', sahara.lifetime.memory())
			.registerInstance(req, 'Response', sahara.lifetime.memory());
		next();
	};
};