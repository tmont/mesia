var should = require('should'),
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

		new Repository({}, Foo, cache).useCache(key, onMiss, onHit, null, function(err, entity) {
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
});