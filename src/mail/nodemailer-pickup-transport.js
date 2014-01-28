var mail = require('nodemailer'),
  util = require('util'),
  MailTransport = require('./mail-transport');

function NodeMailerPickupTransport(/** SmtpConfig */config, /** MailTemplatesDir */templatesDir) {
  MailTransport.call(this, templatesDir);
  this.transport = mail.createTransport('PICKUP', config);
}

util.inherits(NodeMailerPickupTransport, MailTransport);

util._extend(NodeMailerPickupTransport.prototype, {
  sendMail: function(message, callback) {
    this.transport.sendMail(message, callback);
  }
});

module.exports = NodeMailerPickupTransport;