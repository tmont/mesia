var winston = require('winston'),
	util = require('util'),
	posix = require('posix');

function SyslogTransport(options) {
	options = options || {};
	winston.Transport.call(this, options);
	this.id = options.id || process.title;
	this.facility = options.facility || 'local0';
	this.showPid = !!options.showPid;
}

util.inherits(SyslogTransport, winston.Transport);

util._extend(SyslogTransport.prototype, {
	name: 'syslog',
	log: function(level, msg, meta, callback) {
		if (this.silent) {
			callback(null, true);
			return;
		}

		if (level === 'error') {
			level = 'err';
		} else if (level === 'warn') {
			level = 'warning';
		}

		var message = '[' + level + '] ' + msg;
		if (typeof(meta) === 'string') {
			message += ' ' + meta;
		} else if (meta && typeof(meta) === 'object' && Object.keys(meta).length > 0) {
			message += ' ' + util.inspect(meta, false, null, true);
		}

		var options = {
			cons: true,
			pid: this.showPid
		};
		posix.openlog(this.id, options, this.facility);
		posix.syslog(level, message);
		posix.closelog();

		callback(null, true);
	}
});

module.exports = SyslogTransport;