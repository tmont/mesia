function addressToArray(address) {
	return Array.isArray(address)
		? address
		: address.split(',').map(function(address) {
			return address.trim();
		});
}

function SmtpTransport() { }

SmtpTransport.prototype = {
	send: function(from, to, subject, body, options, callback) {
		if (typeof(options) === 'function') {
			callback = options;
			options = {};
		}

		options = options || {};

		body = typeof(body) === 'string' ? { text: body } : body;
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

		this.sendMail(message, callback);
	},

	sendMail: function(message, callback) { }
};

module.exports = SmtpTransport;
