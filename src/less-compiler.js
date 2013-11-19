var less = require('less'),
	fs = require('fs'),
	path = require('path');

function LessCompiler(root, paths, options) {
	this.root = root;
	this.cache = {};
	this.useCache = !!options.useCache;
	this.paths = [ this.root ].concat(paths || []);
}

LessCompiler.prototype = {
	compileFile: function(file, callback) {
		var realFile = path.join(this.root, file.replace(/\.css$/, '.less')),
			self = this;

		if (this.useCache && this.cache[realFile]) {
			callback(null, this.cache[realFile]);
			return;
		}

		fs.readFile(realFile, 'utf8', function(err, contents) {
			if (err) {
				callback(err);
				return;
			}

			self.compile(contents, function(err, result) {
				if (!err && self.useCache) {
					self.cache[realFile] = result;
				}

				callback(err, result);
			});
		});
	},

	compile: function(source, callback) {
		less.render(source, { paths: this.paths }, callback);
	}
};

module.exports = LessCompiler;