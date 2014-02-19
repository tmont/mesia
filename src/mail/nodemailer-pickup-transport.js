var mail = require('nodemailer'),
	util = require('util'),
	MailTransport = require('./mail-transport');

function NodeMailerPickupTransport(/** PickupConfig */config, /** TemplateEvaluator */templateEvaluator) {
	MailTransport.call(this, templateEvaluator);
	this.transport = mail.createTransport('PICKUP', config);
}

util.inherits(NodeMailerPickupTransport, MailTransport);

util._extend(NodeMailerPickupTransport.prototype, {
	sendMail: function(message, callback) {
		this.transport.sendMail(message, callback);
	}
});

module.exports = NodeMailerPickupTransport;