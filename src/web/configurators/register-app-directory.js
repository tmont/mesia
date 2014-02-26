var path = require('path'),
	fs = require('fs');

module.exports = function(relativeDir) {
	return function(container, libs, next) {
		var root = container.resolveSync('AppRoot'),
			dir = path.join(root, relativeDir),
			files = fs.readdirSync(dir);

		files.forEach(function(file) {
			if (!/\.js$/.test(file)) {
				return;
			}

			var absolutePath = path.join(dir, file);
			container.registerType(require(absolutePath));
		});

		next();
	};
};