var should = require('should'),
	mail = require('../').mail,
	async = require('async'),
	fs = require('fs'),
	path = require('path');

describe('Mail', function() {
	it('should compose message object with string body', function(done) {
		var sendMail = 0;
		var transport = new mail.MailTransport();
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
		var transport = new mail.MailTransport();
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
		var transport = new mail.MailTransport();
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
					var transport = new mail.MailTransport();
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
					var transport = new mail.MailTransport();
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
		it('should generate templates in directory', function(done) {
			var evaluator = new mail.EmailTemplateEvaluator(__dirname + '/mail/templates');
			evaluator.init(function(err) {
				should.not.exist(err);
				evaluator.templates.should.have.property('another');
				evaluator.templates.should.have.property('basic');

				evaluator.templates.another.should.have.length(2);
				evaluator.templates.basic.should.have.length(2);
				done();
			});
		});

		it('should generate body via template', function(done) {
			var sendMail = 0;
			var evaluator = new mail.EmailTemplateEvaluator(__dirname + '/mail/templates');
			var transport = new mail.MailTransport(evaluator);
			transport.sendMail = function(message, callback) {
				sendMail++;
				message.should.have.property('from', 'foo@bar.com');
				message.should.have.property('to', [ 'x@y.com' ]);
				message.should.have.property('subject', 'a');
				message.should.have.property('text', 'howdy do? Foo Bar\n\nSigned,\nThis guy');

				var expectedHtml = '<html>\n\
<head>\n\n\
</head>\n\
<body style="font-family: Consolas; font-size: 16px;">\n\
<p>howdy do?</p>\n\
<p class="red" style="color: red;">Your name is Foo Bar</p>\n\
</body>\n\
</html>\n';
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

	describe('with NodemailerPickupTransport', function() {

		var pickupDir = path.join(__dirname, 'pickup');

		before(function(done) {
			fs.exists(pickupDir, function(exists) {
				if (!exists) {
					fs.mkdir(pickupDir, function(err) {
						done(err);
					});
					return;
				}

				done();
			});
		});

		it('should send email with pickup transport', function(done) {
			var config = {
				directory: pickupDir
			};
			var evaluator = new mail.EmailTemplateEvaluator(__dirname + '/mail/templates');
			var mailer = new mail.NodeMailerPickupTransport(config, evaluator);
			var options = {
				template: 'basic',
				locals: {
					hello: 'Well hello there, ',
					name: 'Tommy Boy'
				}
			};
			mailer.send('x@y.com', 'a@b.com', 'Test', options, function(err, email) {
				should.not.exist(err);
				should.exist(email);

				fs.exists(email.path, function(exists) {
					should.exist(exists);
					done();
				});
			});
		});

		after(function(done) {
			fs.exists(pickupDir, function(exists) {
				if (exists) {
					fs.readdir(pickupDir, function(err, files) {
						if (err) {
							done(err);
							return;
						}

						async.forEach(files, function(file, next) {
							fs.unlink(path.join(pickupDir, file), next);
						}, function(err) {
							if (err) {
								done(err);
								return;
							}
							fs.rmdir(pickupDir, done);
						});
					});
					return;
				}

				done();
			});
		});
	});
});

