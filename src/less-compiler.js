var less = require('less'),
	fs = require('fs'),
	path = require('path');

function LessCompiler(root, paths) {
	this.root = root;
	this.paths = [ this.root ].concat(paths || []);
}

LessCompiler.prototype = {
	compileFile: function(file, callback) {
		var realFile = path.join(this.root, file.replace(/\.css$/, '.less')),
			self = this;
		fs.readFile(realFile, 'utf8', function(err, contents) {
			if (err) {
				callback(err);
				return;
			}

			self.compile(contents, callback);
		});
	},

	compile: function(source, callback) {
		less.render(source, { paths: this.paths }, callback);
	}
};

module.exports = LessCompiler;