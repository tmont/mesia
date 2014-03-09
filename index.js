module.exports = {
	JadeCompiler: require('./src/jade-compiler'),
	LessCompiler: require('./src/less-compiler'),
	Logger: require('./src/logger'),
	utils: require('./src/utils'),
	web: require('./src/web'),
	persistence: require('./src/persistence'),
	mail: {
		MailTransport: require('./src/mail/mail-transport'),
		NodeMailerSmtpTransport: require('./src/mail/nodemailer-smtp-transport'),
		NodeMailerPickupTransport: require('./src/mail/nodemailer-pickup-transport'),
		EmailTemplateEvaluator: require('./src/mail/email-template-evaluator')
	}
};