var mail = require('nodemailer'),
	util = require('util'),
	SmtpTransport = require('./smtp-transport');

function NodeMailerSmtpTransport(/** SmtpConfig */config) {
	SmtpTransport.call(this);
	this.transport = mail.createTransport('SMTP', config);
}

util.inherits(NodeMailerSmtpTransport, SmtpTransport);

util._extend(NodeMailerSmtpTransport.prototype, {
	sendMail: function(message, callback) {
		this.transport.sendMail(message, callback);
	}
});

module.exports = NodeMailerSmtpTransport;