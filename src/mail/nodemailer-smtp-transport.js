var mail = require('nodemailer'),
	util = require('util'),
  MailTransport = require('./mail-transport');

function NodeMailerSmtpTransport(/** SmtpConfig */config, /** MailTemplatesDir */templatesDir) {
  MailTransport.call(this, templatesDir);
	this.transport = mail.createTransport('SMTP', config);
}

util.inherits(NodeMailerSmtpTransport, MailTransport);

util._extend(NodeMailerSmtpTransport.prototype, {
	sendMail: function(message, callback) {
		this.transport.sendMail(message, callback);
	}
});

module.exports = NodeMailerSmtpTransport;