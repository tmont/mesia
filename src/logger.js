var cluster = require('cluster'),
	util = require('util'),
	winston = require('winston');

require('colors');

function Logger(logger, options) {
	options = options || {};

	this.showPid = !!options.showPid;
	this.logger = logger;

	this.logger.on('error', function(err) {
		console.error('Error while logging', err);
	});
}

Logger.levels = {
	trace: 0,
	debug: 1,
	info: 2,
	warn: 3,
	error: 4
};

Logger.colors = {
	trace: 'grey',
	debug: 'cyan',
	info: 'green',
	warn: 'yellow',
	error: 'red'
};

winston.addColors(Logger.colors);

Logger.transports = {
	console: function(options) {
		return new winston.transports.Console({
			timestamp: options.timestamps === 'verbose' ? true : function() {
				var date = new Date(),
					ms = date.getMilliseconds().toString();
				ms = ms + new Array((3 - ms.length + 1)).join('0');
				return [ date.getHours(), date.getMinutes(), date.getSeconds() ]
					.map(function(value) {
						return value < 10 ? '0' + value : value;
					})
					.join(':') + '.' + ms;
			},
			level: options.level,
			colorize: true
		});
	}
};

Logger.create = function(config) {
	var transports = (config.transports || []).map(function(name) {
		return Logger.transports[name](config);
	});

	if (!transports.length) {
		transports.push(Logger.transports.console(config));
	}

	var logger = new winston.Logger({
		level: config.level,
		levels: Logger.levels,
		transports: transports
	});

	return new Logger(logger, config);
};

function log(level) {
	return function() {
		var message = Array.prototype.slice.call(arguments).map(function(arg) {
			if (typeof(arg) === 'object') {
				var message = util.inspect(arg, false, 5, true);
				if (arg && arg.stack) {
					message += '\n' + arg.stack;
				}
				return message;
			}

			return (arg || '').toString();
		}).join(' ');

		var pid = '';
		if (this.showPid) {
			pid = '[' + (cluster.isMaster ? 'master' : cluster.worker.process.pid) + '] ';
		}

		this.logger.log(level, pid + message);
	};
}

Logger.prototype = {
	isDebugEnabled: function() {
		return this.logger.level === 'debug' || this.logger.level === 'trace';
	},
	trace: log('trace'),
	debug: log('debug'),
	info: log('info'),
	warn: log('warn'),
	error: log('error'),
	middleware: function(req, res, next) {
		this.trace('middleware: log');
		var signature = req.method + ' ' + req.url + ' HTTP/' + req.httpVersion,
			start = Date.now(),
			log = this;

		log.info(signature);

		if (!this.isDebugEnabled()) {
			next();
			return;
		}

		res.on('finish', function() {
			var elapsed = (Date.now() - start),
				elapsedColor = '';
			if (elapsed >= 500) {
				elapsedColor = 'red';
			} else if (elapsed >= 250) {
				elapsedColor = 'magenta';
			} else if (elapsed >= 100) {
				elapsedColor = 'cyan';
			}

			elapsed += 'ms';
			if (elapsedColor) {
				elapsed = elapsed[elapsedColor];
			}

			var status = res.statusCode.toString();
			if (status < 300) {
				status = status.green;
			} else if (status < 400) {
				status = status.yellow;
			} else {
				status = status.red;
			}

			log.debug([ elapsed, status, signature ].join(' '));
		});
		next();
	}
};

Object.defineProperty(Logger, 'noop', {
	value: new Logger({
		log: function(level, message) {},
		on: function() { }
	})
});

module.exports = Logger;

