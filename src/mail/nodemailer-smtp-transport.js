var mail = require('nodemailer'),
	util = require('util'),
	SmtpTransport = require('./smtp-transport');

function NodeMailerSmtpTransport(/** SmtpConfig */config, /** MailTemplatesDir */templatesDir) {
	SmtpTransport.call(this, templatesDir);
	this.transport = mail.createTransport('SMTP', config);
}

util.inherits(NodeMailerSmtpTransport, SmtpTransport);

util._extend(NodeMailerSmtpTransport.prototype, {
	sendMail: function(message, callback) {
		this.transport.sendMail(message, callback);
	}
});

module.exports = NodeMailerSmtpTransport;