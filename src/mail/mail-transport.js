function addressToArray(address) {
	return Array.isArray(address)
		? address
		: address.split(',').map(function(address) {
			return address.trim();
		});
}

function MailTransport(templatesDir) {
	this.templatesDir = templatesDir || null;
	this.tmpl = null;
}

MailTransport.prototype = {
	evaluateTemplate: function(template, locals, callback) {
		var self = this;
		if (!this.tmpl) {
			require('email-templates')(this.templatesDir, function(err, tmpl) {
				if (err) {
					callback(err);
					return;
				}

				self.tmpl = tmpl;
				evaluateTemplate();
			});
		} else {
			evaluateTemplate();
		}

		function evaluateTemplate() {
			self.tmpl(template, locals || {}, function(err, html, text) {
				callback(err, { text: text, html: html });
			});
		}
	},

	send: function(from, to, subject, options, callback) {
		if (typeof(options) === 'function') {
			callback = options;
			options = {};
		}

		options = options || {};

		var self = this;

		if (options.template) {
			this.evaluateTemplate(options.template, options.locals, sendMessage);
		} else {
			var body = typeof(options.body) === 'string'
				? { text: options.body }
				: options.body || {};

			sendMessage(null, body);
		}

		function sendMessage(err, body) {
			if (err) {
				callback && callback(err);
				return;
			}

			var message = {
				from: from,
				to: addressToArray(to),
				subject: subject,
				text: body.text,
				html: body.html
			};

			[
				'headers',
				'alternatives',
				'attachments',
				'encoding',
				'charset'
			].forEach(function(option) {
				if (option in options) {
					message[option] = options[option];
				}
			});

			[
				'cc',
				'bcc',
				'replyTo',
				'inReplyTo'
			].forEach(function(option) {
				if (option in options) {
					message[option] = addressToArray(options[option]);
				}
			});

			self.sendMail(message, callback);
		}
	},

	sendMail: function(message, callback) { }
};

module.exports = MailTransport;
