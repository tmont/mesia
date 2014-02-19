var cluster = require('cluster'),
	util = require('util'),
	SyslogTransport = require('./syslog-transport'),
	winston = require('winston');

function Logger(logger, options) {
	options = options || {};

	this.showPid = !!options.showPid;
	this.logger = logger;

	this.logger.on('error', function(err) {
		console.error('Error while logging', err);
	});
}

Logger.levels = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3
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
	syslog: function(options) {
		return new SyslogTransport({
			level: options.level,
			id: options.id,
			facility: options.facility,
			showPid: options.showPid
		});
	},

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
		if (!this.isDebugEnabled()) {
			next();
			return;
		}

		var signature = req.method + ' ' + req.url + ' HTTP/' + req.httpVersion,
			start = Date.now(),
			log = this;

		log.debug(signature);

		res.on('finish', function() {
			var elapsed = (Date.now() - start);
			if (elapsed >= 500) {
				elapsed = '\x1B[31m' + elapsed + 'ms\x1B[39m';
			} else if (elapsed >= 250) {
				elapsed = '\x1B[35m' + elapsed + 'ms\x1B[39m';
			} else if (elapsed >= 100) {
				elapsed = '\x1B[36m' + elapsed + 'ms\x1B[39m';
			} else {
				elapsed += 'ms';
			}

			var status = res.statusCode;
			if (status < 300) {
				status = '\x1B[32m' + status + '\x1B[39m';
			} else if (status < 400) {
				status = '\x1B[33m' + status + '\x1B[39m';
			} else {
				status = '\x1B[31m' + status + '\x1B[39m';
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

