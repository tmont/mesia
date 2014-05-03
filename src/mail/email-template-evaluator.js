var fs = require('fs'),
	path = require('path'),
	ejs = require('ejs'),
	juice = require('juice2'),
	async = require('async');

function EmailTemplateEvaluator(/** MailTemplatesDir */templatesDir) {
	this.templatesDir = templatesDir || null;
	this.templates = {};
	this.initialized = false;
}

EmailTemplateEvaluator.prototype.init = function(callback) {
	if (this.initialized) {
		callback();
		return;
	}

	var self = this;
	fs.readdir(this.templatesDir, function(err, dirs) {
		if (err) {
			callback(err);
			return;
		}

		function compileTemplate(name, next) {
			if (name.charAt(0) === '.') {
				next();
				return;
			}

			var dirPath = path.join(self.templatesDir, name);

			fs.stat(dirPath, function(err, stat) {
				if (!stat.isDirectory()) {
					next();
					return;
				}

				fs.readdir(dirPath, function(err, files) {
					if (err) {
						next(err);
						return;
					}

					function processFile(file, next) {
						if (!/\.ejs$/.test(file)) {
							next();
							return;
						}

						var contentType = path.basename(file, '.ejs'),
							filePath = path.join(dirPath, file);

						var options = {
							encoding: 'utf8'
						};
						fs.readFile(filePath, options, function(err, contents) {
							if (err) {
								next(err);
								return;
							}

							if (!self.templates[name]) {
								self.templates[name] = [];
							}

							self.templates[name].push({
								path: filePath,
								tmpl: ejs.compile(contents),
								type: contentType
							});

							next();
						});
					}

					async.each(files, processFile, next);
				});
			});
		}

		async.each(dirs, compileTemplate, function(err) {
			self.initialized = true;
			callback(err);
		});
	});
};

EmailTemplateEvaluator.prototype.evaluateTemplate = function(template, locals, callback) {
	var self = this;
	this.init(function(err) {
		if (err) {
			callback(err);
			return;
		}

		var templateData = self.templates[template];
		if (!templateData) {
			callback(new Error('Unknown template: ' + template));
			return;
		}

		var result = {};

		function render(data, next) {
			var html = data.tmpl(locals);
			if (data.type === 'text') {
				result[data.type] = html;
				next();
				return;
			}

			var options = {
				url: 'file://' + data.path
			};

			juice.juiceContent(html, options, function(err, html) {
				result[data.type] = html;
				next(err);
			});
		}

		async.each(templateData, render, function(err) {
			callback(err, result);
		});
	});
};

module.exports = EmailTemplateEvaluator;