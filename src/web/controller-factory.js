module.exports = function(container) {
	return function(name, context, callback) {
		var className = name.charAt(0).toUpperCase() + name.substring(1) + 'Controller';
		context.req.container.resolve(className, function(err, controller) {
			if (err) {
				callback(err);
				return;
			}

			callback(null, controller);
		});
	};
};

