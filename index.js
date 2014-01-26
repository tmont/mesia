module.exports = {
	JadeCompiler: require('./src/jade-compiler'),
	LessCompiler: require('./src/less-compiler'),
	SyslogTransport: require('./src/syslog-transport'),
	Logger: require('./src/logger'),
	utils: require('./src/utils'),
	web: require('./src/web'),
	persistence: require('./src/persistence'),
	mail: {
		SmtpTransport: require('./src/mail/smtp-transport'),
		NodeMailerSmtpTransport: require('./src/mail/nodemailer-smtp-transport')
	}
};