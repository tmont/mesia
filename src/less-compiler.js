var less = require('less'),
	fs = require('fs'),
	path = require('path');

function LessCompiler(root, paths, options) {
	options = options || {};
	this.root = root;
	this.cache = {};
	this.useCache = !!options.useCache;
	this.paths = [ this.root ].concat(paths || []);
}

LessCompiler.prototype = {
	compileFile: function(file, callback) {
		var realFile = path.join(this.root, file.replace(/\.css$/, '.less')),
			self = this,
			cached = this.cache[realFile];

		if (this.useCache && cached) {
			callback(null, cached);
			return;
		}

		fs.readFile(realFile, 'utf8', function(err, contents) {
			if (err) {
				callback(err);
				return;
			}

			self.compile(contents, function(err, css) {
				if (!err && self.useCache) {
					cached = self.cache[realFile] = {
						value: css,
						mtime: new Date()
					};
				}

				callback(err, { value: css, mtime: cached && cached.mtime });
			});
		});
	},

	compile: function(source, callback) {
		less.render(source, { paths: this.paths }, callback);
	}
};

module.exports = LessCompiler;