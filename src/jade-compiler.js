var jade = require('jade'),
	fs = require('fs'),
	path = require('path');

function JadeCompiler(root, options) {
	options = options || {};
	this.root = root;
	this.options = {
		compileDebug: !!options.debug,
		pretty: !!options.pretty
	};
}

JadeCompiler.prototype = {
	compileFile: function(file, options, callback) {
		var realFile = path.join(this.root, file + '.jade'),
			self = this;

		options = options || {};
		options.filename = realFile;

		fs.readFile(realFile, 'utf8', function(err, contents) {
			if (err) {
				callback(err);
				return;
			}

			self.compile(contents, options, function(err, template) {
				if (err) {
					callback(err);
					return;
				}

				callback(null, template);
			});
		});
	},

	compile: function(source, options, callback) {
		options = options || {};
		for (var key in this.options) {
			if (!(key in options)) {
				options[key] = this.options[key];
			}
		}

		try {
			callback(null, jade.compile(source, options));
		} catch (e) {
			callback(e);
		}
	}
};

module.exports = JadeCompiler;