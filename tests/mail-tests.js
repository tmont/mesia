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

		transport.send('foo@bar.com', 'skank@skeez.com', 'This is the subject', { body: 'This is the body' }, function(err) {
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

		var options = {
			body: {
				text: 'This is the body',
				html: 'This is the html'
			}
		};
		transport.send('foo@bar.com', 'skank@skeez.com', 'This is the subject', options, function(err) {
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

		transport.send('foo@bar.com', 'x@y.com, a@b.com', 'a', { body: 'b' }, function(err) {
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
					message.should.have.property(option, 'foo');
					callback();
				};

				var options = {};
				options[option] = 'foo';
				transport.send('x@y.com', 'a@b.com', 'a', options, function(err) {
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
					message.should.have.property(option, [ 'foo' ]);
					callback();
				};

				var options = {};
				options[option] = 'foo';
				transport.send('x@y.com', 'a@b.com', 'a', options, function(err) {
					should.not.exist(err);
					sendMail.should.equal(1);
					done();
				});
			});
		});
	});

	describe('with templating', function() {
		it('should generate body via template', function(done) {
			var sendMail = 0;
			var transport = new mail.SmtpTransport(__dirname + '/mail/templates');
			transport.sendMail = function(message, callback) {
				sendMail++;
				message.should.have.property('from', 'foo@bar.com');
				message.should.have.property('to', [ 'x@y.com' ]);
				message.should.have.property('subject', 'a');
				message.should.have.property('text', 'howdy do? Foo Bar\n\nSigned,\nThis guy');

				var expectedHtml = '<html>\n\
	<body style="font-size: 16px; font-family: Consolas;">\n\
		<p>howdy do?</p>\n\
		<p class="red" style="color: red;">Your name is Foo Bar</p>\n\
	</body>\n\
</html>';
				message.html.should.equal(expectedHtml);
				callback();
			};

			var options = {
				template: 'basic',
				locals: {
					hello: 'howdy do?',
					name: 'Foo Bar'
				}
			};
			transport.send('foo@bar.com', 'x@y.com', 'a', options, function(err) {
				should.not.exist(err);
				sendMail.should.equal(1);
				done();
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
			var mailer = new mail.NodeMailerSmtpTransport(config, __dirname + '/mail/templates');
			var options = {
				template: 'basic',
				locals: {
					hello: 'Well hello there, ',
					name: 'Tommy Boy'
				}
			};
			mailer.send('tommy.mont@gmail.com', 'tmont@tmont.com', 'Testing nodemailer', options, function(err) {
				console.log(require('util').inspect(arguments, false, null, true));
				done(err);
			});
		});
	}

	if (process.env.NODEMAILER === '1') {
		testNodeMailer();
	}

});

