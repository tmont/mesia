var should = require('should'),
	JadeCompiler = require('../').JadeCompiler;

describe('jade compiler', function() {
	it('should compile template', function(done) {
		var compiler = new JadeCompiler();
		compiler.compile('p Hello', null, function(err, tmpl) {
			should.not.exist(err);
			tmpl({}).should.equal('<p>Hello</p>');
			done();
		});
	});

	it('should compile template with case fall through', function(done) {
		var compiler = new JadeCompiler();
		var template = '\n\
- var foo = 10;\n\
case foo\n\
	when 0\n\
	when 1\n\
		p you are a loser\n\
	when 10\n\
	default\n\
		p Lots\n\
';
		compiler.compile(template, null, function(err, tmpl) {
			should.not.exist(err);
			tmpl({}).should.equal('<p>Lots</p>');
			done();
		});
	});

	it('should compile template for client', function(done) {
		var compiler = new JadeCompiler();
		compiler.compile('p Hello', { client: true }, function(err, tmpl) {
			should.not.exist(err);
			tmpl.should.be.instanceOf(String);
			eval('(' + tmpl + ')')({}).should.equal('<p>Hello</p>');
			done();
		});
	});

	it('should compile template prettily', function(done) {
		var compiler = new JadeCompiler();
		compiler.compile('div\n div hello', { pretty: true }, function(err, tmpl) {
			should.not.exist(err);
			tmpl({}).should.equal('\n<div>\n  <div>hello</div>\n</div>');
			done();
		});
	});

	it('should inherit options from ctor', function(done) {
		var compiler = new JadeCompiler(null, { pretty: true });
		compiler.compile('div\n div hello', null, function(err, tmpl) {
			should.not.exist(err);
			tmpl({}).should.equal('\n<div>\n  <div>hello</div>\n</div>');
			done();
		});
	});
});