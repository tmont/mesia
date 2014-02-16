var should = require('should'),
	moment = require('moment-timezone'),
	Validator = require('../').persistence.Validator,
	validators = Validator.validators;

describe('Validator', function() {
	function validateError(err, field, entity, message) {
		should.exist(err);
		err.should.have.property('isValidationError', true);
		err.should.have.property('field', field);
		err.should.have.property('entity', entity);
		err.should.have.property('message', field + ' ' + message);
	}

	describe('integers', function() {
		it('integer should pass integer validation', function(done) {
			var entity = { id: 1 };

			var validator = new Validator()
				.map('id', validators.integer);

			validator.validate(entity, function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('string should not pass integer validation', function(done) {
			var entity = { id: '1' };

			var validator = new Validator()
				.map('id', validators.integer);

			validator.validate(entity, function(err) {
				validateError(err, 'id', entity, 'must be an integer');
				done();
			});
		});

		it('float should not pass integer validation', function(done) {
			var entity = { id: 1.1 };

			var validator = new Validator()
				.map('id', validators.integer);

			validator.validate(entity, function(err) {
				validateError(err, 'id', entity, 'must be an integer');
				done();
			});
		});
	});

	describe('floats', function() {
		it('float should pass float validation', function(done) {
			var entity = { id: 1.2 };

			var validator = new Validator()
				.map('id', validators.float);

			validator.validate(entity, function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('string should not pass float validation', function(done) {
			var entity = { id: '1.2' };

			var validator = new Validator()
				.map('id', validators.float);

			validator.validate(entity, function(err) {
				validateError(err, 'id', entity, 'must be a float');
				done();
			});
		});

		it('integer should not pass float validation', function(done) {
			var entity = { id: 1 };

			var validator = new Validator()
				.map('id', validators.float);

			validator.validate(entity, function(err) {
				validateError(err, 'id', entity, 'must be a float');
				done();
			});
		});
	});

	describe('string length', function() {
		it('string with exact length should validate exact length', function(done) {
			var entity = { id: 'asdf' };

			var validator = new Validator()
				.map('id', validators.stringLength(4, 4));

			validator.validate(entity, function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('short string should validate upper bound', function(done) {
			var entity = { id: 'asdf' };

			var validator = new Validator()
				.map('id', validators.stringLength(0, 5));

			validator.validate(entity, function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('long string should validate lower bound', function(done) {
			var entity = { id: 'asdf' };

			var validator = new Validator()
				.map('id', validators.stringLength(3));

			validator.validate(entity, function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('short string should not pass validation for lower bound', function(done) {
			var entity = { id: 'asdf' };

			var validator = new Validator()
				.map('id', validators.stringLength(5));

			validator.validate(entity, function(err) {
				validateError(err, 'id', entity, 'must be at least 5 characters long');
				done();
			});
		});



		it('short string should not pass validation for lower bound with upper bound', function(done) {
			var entity = { id: 'asdf' };

			var validator = new Validator()
				.map('id', validators.stringLength(5, 7));

			validator.validate(entity, function(err) {
				validateError(err, 'id', entity, 'must be between 5 and 7 characters long');
				done();
			});
		});

		it('long string should not pass validation for exact length', function(done) {
			var entity = { id: 'asdfasdf' };

			var validator = new Validator()
				.map('id', validators.stringLength(7, 7));

			validator.validate(entity, function(err) {
				validateError(err, 'id', entity, 'must be exactly 7 characters long');
				done();
			});
		});

		it('long string should not pass validation for upper bound', function(done) {
			var entity = { id: 'asdfasdf' };

			var validator = new Validator()
				.map('id', validators.stringLength(5, 7));

			validator.validate(entity, function(err) {
				validateError(err, 'id', entity, 'must be between 5 and 7 characters long');
				done();
			});
		});
	});

	describe('nullable', function() {
		it('should allow null', function(done) {
			var entity = { id: null };

			var validator = new Validator()
				.map('id', validators.nullable());

			validator.validate(entity, function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should allow undefined', function(done) {
			var entity = { id: undefined };

			var validator = new Validator()
				.map('id', validators.nullable());

			validator.validate(entity, function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should fall through to validator if not null', function(done) {
			var entity = { id: 'asdf' };

			var validated = false;
			function v(entity, value, callback) {
				validated = true;
				callback();
			}

			var validator = new Validator()
				.map('id', validators.nullable(v));

			validator.validate(entity, function(err) {
				should.not.exist(err);
				validated.should.equal(true);
				done();
			});
		});
	});

	describe('instanceOf', function() {
		it('object of same type should pass validation', function(done) {
			function Foo() {}

			var entity = { foo: new Foo() };

			var validator = new Validator()
				.map('foo', validators.instanceOf(Foo));

			validator.validate(entity, function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('object of different type should not pass validation', function(done) {
			function Foo() {}

			var entity = { foo: new Date() };

			var validator = new Validator()
				.map('foo', validators.instanceOf(Foo));

			validator.validate(entity, function(err) {
				validateError(err, 'foo', entity, 'must be an instance of Foo');
				done();
			});
		});
	});

	describe('regex', function() {
		it('string should pass validation for regex', function(done) {
			var entity = { id: 'asdf' };

			var validator = new Validator()
				.map('id', validators.regex(/.+/));

			validator.validate(entity, function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('string should not pass validation for regex', function(done) {
			var entity = { id: 'asdf' };

			var validator = new Validator()
				.map('id', validators.regex(/foo/));

			validator.validate(entity, function(err) {
				validateError(err, 'id', entity, 'must match regex /foo/');
				done();
			});
		});
	});

	describe('date', function() {
		it('moment should pass validation for date', function(done) {
			var entity = { id: moment() };

			var validator = new Validator()
				.map('id', validators.date);

			validator.validate(entity, function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('date instance should pass validation for date', function(done) {
			var entity = { id: new Date() };

			var validator = new Validator()
				.map('id', validators.date);

			validator.validate(entity, function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('string should not pass validation for date', function(done) {
			var entity = { id: '2012' };

			var validator = new Validator()
				.map('id', validators.date);

			validator.validate(entity, function(err) {
				validateError(err, 'id', entity, 'must be a date');
				done();
			});
		});
	});
});