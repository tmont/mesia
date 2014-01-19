var should = require('should'),
	LessCompiler = require('../').LessCompiler;

describe('less compiler', function() {
	it('should compile less', function(done) {
		var compiler = new LessCompiler();
		compiler.compile('foo { bar { color: red; } }', function(err, css) {
			should.exist(css);
			css.should.equal('foo bar {\n  color: red;\n}\n');
			done();
		});
	});
});