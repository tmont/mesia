function replaceValues(subject, values) {
	if (subject && values) {
		if (Object.prototype.toString.call(values) === '[object Array]') {
			//if it's an array, it's the backbone router
			for (var i = 0; i < values.length; i++) {
				//replace them in order, disregarding the key
				subject = subject.replace(/:\w+\??/i, values[i]);
			}
		} else {
			//this comes from the express router
			for (var name in values) {
				var replacement = values[name];
				if (typeof(replacement) !== 'string' && typeof(replacement) !== 'number') {
					continue;
				}

				subject = subject.replace(new RegExp(':' + name + '\\b\\??', 'gi'), replacement);
			}
		}
	}

	return subject || '';
}

//http://phpjs.org/functions/preg_quote/
function preg_quote(str, delimiter) {
	return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|\\' + (delimiter || '') + '-]', 'g'), '\\$&');
}

function buildUrl(url, values) {
	if (typeof(url) !== 'string') {
		return null;
	}

	var realUrl = replaceValues(url, values)
		//remove optional route values from route string
		.replace(/:[^\?]+\?/g, '')
		//remove trailing slash(es)
		.replace(/\/+$/, '');

	if (!realUrl) {
		realUrl = '/';
	}

	return realUrl;
}

function Route(name, url, title, description, extra) {
	this.name = name;
	this.url = url;
	this.title = title || '';
	this.description = description || this.title;
	this.type = (extra && extra.type) || 'website';
	this.image = extra && extra.image;

	if (typeof(this.url) === 'string') {
		var regex = preg_quote(this.url).replace(/:(\w+)(\?)?/g, function(_, name, optional) {
			return '([-\\w]+)' + (optional ? '?' : '');
		});
		this.regex = new RegExp('^' + regex + '$', 'i');
	} else {
		this.regex = /(?!)/; //always fail regex
	}
}

Route.prototype = {
	middleware: function() {
		var self = this;
		return function(req, res, next) {
			var locals = req.container.tryResolveSync('RequestLocals');
			if (locals) {
				locals.mesiaRoute = self;
			}
			next();
		};
	},

	getUrl: function(values) {
		return buildUrl(this.url, values);
	},

	isMatch: function(url) {
		return this.regex.test(url);
	},

	getInfo: function(values) {
		return {
			type: this.type,
			title: replaceValues(this.title, values),
			description: replaceValues(this.description, values),
			image: replaceValues(this.image, values)
		};
	}
};

Route.createLocals = function(config, routes, buildPath) {
	return {
		url: {
			image: function(file) {
				return buildPath([ config.staticBasePath, 'images', file ]);
			},
			js: function(file) {
				return buildPath([ config.staticBasePath, 'js', file ]);
			},
			font: function(file) {
				return buildPath([ config.staticBasePath, 'fonts', file ]);
			},
			css: function(file) {
				return buildPath([ config.staticBasePath, 'css', file ]);
			},
			template: function(file) {
				return buildPath([ config.staticBasePath, 'templates', file ]);
			},
			route: function(name, values) {
				var route = routes[name];
				if (!route) {
					throw new Error('Invalid route name "' + name + '"');
				}

				return route.getUrl(values);
			}
		}
	};
};

module.exports = Route;
