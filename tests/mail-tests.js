var should = require('should'),
	mail = require('../').mail;

describe('Mail', function() {
	it('should compose message object with string body', function(done) {
		var sendMail = 0;
		var transport = new mail.SmtpTransport();
		transport.sendMail = function(message, callback) {
			sendMail++;
			message.should.have.property('from', 'foo@bar.com');
			message.should.have.property('to', [ 'skank@skeez.com' ]);
			message.should.have.property('subject', 'This is the subject');
			message.should.have.property('text', 'This is the body');
			should.not.exist(message.html);
			callback();
		};

		transport.send('foo@bar.com', 'skank@skeez.com', 'This is the subject', 'This is the body', function(err) {
			should.not.exist(err);
			sendMail.should.equal(1);
			done();
		});
	});

	it('should compose message object with object body with html', function(done) {
		var sendMail = 0;
		var transport = new mail.SmtpTransport();
		transport.sendMail = function(message, callback) {
			sendMail++;
			message.should.have.property('from', 'foo@bar.com');
			message.should.have.property('to', [ 'skank@skeez.com' ]);
			message.should.have.property('subject', 'This is the subject');
			message.should.have.property('text', 'This is the body');
			message.should.have.property('html', 'This is the html');
			callback();
		};

		var body = {
			text: 'This is the body',
			html: 'This is the html'
		};
		transport.send('foo@bar.com', 'skank@skeez.com', 'This is the subject', body, function(err) {
			should.not.exist(err);
			sendMail.should.equal(1);
			done();
		});
	});

	it('should normalize comma-separated addresses to array', function(done) {
		var sendMail = 0;
		var transport = new mail.SmtpTransport();
		transport.sendMail = function(message, callback) {
			sendMail++;
			message.should.have.property('from', 'foo@bar.com');
			message.should.have.property('to', [ 'x@y.com', 'a@b.com' ]);
			message.should.have.property('subject', 'a');
			message.should.have.property('text', 'b');
			callback();
		};

		transport.send('foo@bar.com', 'x@y.com, a@b.com', 'a', 'b', function(err) {
			should.not.exist(err);
			sendMail.should.equal(1);
			done();
		});
	});

	describe('with options', function() {
		[
			'headers',
			'alternatives',
			'attachments',
			'encoding',
			'charset'
		].forEach(function(option) {
			it('should set ' + option + ' on message', function(done) {
				var sendMail = 0;
				var transport = new mail.SmtpTransport();
				transport.sendMail = function(message, callback) {
					sendMail++;
					message.should.have.property('from', 'x@y.com');
					message.should.have.property('to', [ 'a@b.com' ]);
					message.should.have.property('subject', 'a');
					message.should.have.property('text', 'b');
					message.should.have.property(option, 'foo');
					callback();
				};

				var options = {};
				options[option] = 'foo';
				transport.send('x@y.com', 'a@b.com', 'a', 'b', options, function(err) {
					should.not.exist(err);
					sendMail.should.equal(1);
					done();
				});
			});
		});

		[
			'cc',
			'bcc',
			'replyTo',
			'inReplyTo'
		].forEach(function(option) {
			it('should set ' + option + ' on message', function(done) {
				var sendMail = 0;
				var transport = new mail.SmtpTransport();
				transport.sendMail = function(message, callback) {
					sendMail++;
					message.should.have.property('from', 'x@y.com');
					message.should.have.property('to', [ 'a@b.com' ]);
					message.should.have.property('subject', 'a');
					message.should.have.property('text', 'b');
					message.should.have.property(option, [ 'foo' ]);
					callback();
				};

				var options = {};
				options[option] = 'foo';
				transport.send('x@y.com', 'a@b.com', 'a', 'b', options, function(err) {
					should.not.exist(err);
					sendMail.should.equal(1);
					done();
				});
			});
		});
	});

	function testNodeMailer() {
		var config = {
			service: 'Gmail',
			auth: {
				user: process.env.NODEMAILER_USER,
				pass: process.env.NODEMAILER_PASS
			}
		};

		it('should send email using nodemailer', function(done) {
			var mailer = new mail.NodeMailerSmtpTransport(config);
			var body = {
				text: 'Did it work?',
				html: '<h1 style="color: red">Did it work?</h1>'
			};
			mailer.send('tommy.mont@gmail.com', 'tmont@tmont.com', 'Testing nodemailer', body, function(err) {
				console.log(require('util').inspect(arguments, false, null, true));
				done(err);
			});
		});
	}

	if (process.env.NODEMAILER) {
		testNodeMailer();
	}

});

