var should = require('should'),
	Entity = require('../').persistence.Entity,
	Repository = require('../').persistence.Repository;

describe('Repository', function() {
	function Foo() {}

	it('should use cache with miss', function(done) {
		var key = 'asdf',
			missed = 0,
			hit = 0,
			gets = 0,
			sets = 0,
			result = {};

		var cache = {
			log: { debug: function() {} },
			get: function(key, callback) {
				gets++;
				key.should.equal('asdf');
				callback();
			},

			set: function(key, value, expiry, callback) {
				sets++;
				key.should.equal('asdf');
				value.should.equal(result);
				should.not.exist(expiry);
				callback();
			}
		};

		function onMiss(callback) {
			missed++;
			callback(null, result);
		}

		function onHit(json, callback) {
			hit++;
			callback(null, json);
		}

		new Repository({}, Foo, cache).useCache(key, onMiss, onHit, function(err, entity) {
			should.not.exist(err);
			entity.should.equal(result);
			missed.should.equal(1);
			hit.should.equal(0);
			gets.should.equal(1);
			sets.should.equal(1);
			done();
		});
	});

	it('should use cache with hit', function(done) {
		var key = 'asdf',
			hit = 0,
			gets = 0,
			result = {};

		var cache = {
			log: {
				debug: function(message) {}
			},
			get: function(key, callback) {
				gets++;
				key.should.equal('asdf');
				callback(null, result);
			},

			set: function(key, value, expiry, callback) {
				throw new Error('set should not have been called');
			}
		};

		function onMiss(callback) {
			throw new Error('onMiss should not have been called');
		}

		function onHit(json, callback) {
			hit++;
			callback(null, json);
		}

		new Repository({}, Foo, cache).useCache(key, onMiss, onHit, null, function(err, entity) {
			should.not.exist(err);
			entity.should.equal(result);
			hit.should.equal(1);
			gets.should.equal(1);
			done();
		});
	});

	it('should cache entity as DTO', function(done) {
		var key = 'asdf',
			missed = 0,
			gets = 0,
			sets = 0,
			result = new Foo();

		var cache = {
			log: {
				debug: function(message) {
				}
			},
			get: function(key, callback) {
				gets++;
				key.should.equal('asdf');
				callback();
			},

			set: function(key, value, expiry, callback) {
				sets++;
				key.should.equal('asdf');
				value.should.have.property('foo', 'bar');
				value.should.have.property('bar', 'baz');
				callback(null, result);
			}
		};

		function onMiss(callback) {
			missed++;
			callback(null, result);
		}

		function onHit(json, callback) {
			throw new Error('onMiss should not have been called');
		}

		function Foo() {
			this.foo = 'bar';
			this.bar = 'baz';
		}

		Entity.inherit(Foo);

		Foo.prototype.getDtoProperties = function() {
			return [ 'foo' ];
		};

		Foo.prototype.getFullDto = function() {
			var dto = this.toDto();
			dto.bar = this.bar;
			return dto;
		};

		new Repository({}, Foo, cache).useCache(key, onMiss, onHit, null, function(err, entity) {
			should.not.exist(err);
			entity.should.equal(result);
			missed.should.equal(1);
			gets.should.equal(1);
			sets.should.equal(1);
			done();
		});
	});
});