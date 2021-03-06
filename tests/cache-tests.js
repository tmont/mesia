var should = require('should'),
	caching = require('../').persistence.caching;

describe('Caching', function() {
	var log = require('../').Logger.noop;
	describe('with redis', function() {
		it('should set value with no ttl', function(done) {
			var setex = 0;
			var client = {
				setex: function(key, ttl, value, callback) {
					setex++;
					key.should.equal('foo');
					ttl.should.equal(86400);
					value.should.equal('bar');
					callback();
				}
			};

			var cache = new caching.RedisCache(client, log);
			cache.set('foo', 'bar', function(err) {
				should.not.exist(err);
				setex.should.equal(1);
				done();
			});
		});

		it('should set value with specific ttl', function(done) {
			var setex = 0;
			var client = {
				setex: function(key, ttl, value, callback) {
					setex++;
					key.should.equal('foo');
					ttl.should.equal(7);
					value.should.equal('bar');
					callback();
				}
			};

			var cache = new caching.RedisCache(client, log);
			cache.set('foo', 'bar', 7, function(err) {
				should.not.exist(err);
				setex.should.equal(1);
				done();
			});
		});

		it('should set value with ttl as Date', function(done) {
			var setex = 0;
			var client = {
				setex: function(key, ttl, value, callback) {
					setex++;
					key.should.equal('foo');
					ttl.should.be.approximately(600, 1);
					value.should.equal('bar');
					callback();
				}
			};

			var cache = new caching.RedisCache(client, log),
				ttl = new Date();

			ttl.setMinutes(ttl.getMinutes() + 10);
			cache.set('foo', 'bar', ttl, function(err) {
				should.not.exist(err);
				setex.should.equal(1);
				done();
			});
		});

		it('should get value', function(done) {
			var gets = 0;
			var client = {
				get: function(key, callback) {
					gets++;
					key.should.equal('foo');
					callback(null, 'bar');
				}
			};

			var cache = new caching.RedisCache(client, log);
			cache.get('foo', function(err, value) {
				should.not.exist(err);
				gets.should.equal(1);
				value.should.equal('bar');
				done();
			});
		});

		it('should invalidate value', function(done) {
			var dels = 0;
			var client = {
				del: function(key, callback) {
					dels++;
					key.should.equal('foo');
					callback();
				}
			};

			var cache = new caching.RedisCache(client, log);
			cache.invalidate('foo', function(err) {
				should.not.exist(err);
				dels.should.equal(1);
				done();
			});
		});

		it('should invalidate wildcard value using keys', function(done) {
			var delKeys = [],
				keys = 0;
			var client = {
				keys: function(pattern, callback) {
					keys++;
					pattern.should.equal('foo*');
					callback(null, [ 'foo', 'foot', 'fook' ]);
				},

				del: function(key, callback) {
					delKeys.push(key);
					callback();
				}
			};

			var cache = new caching.RedisCache(client, log);
			cache.invalidate('foo*', function(err) {
				should.not.exist(err);
				keys.should.equal(1);
				delKeys.should.have.length(3);
				delKeys.should.containEql('foo');
				delKeys.should.containEql('foot');
				delKeys.should.containEql('fook');
				done();
			});
		});
	});

	describe('JSON', function() {
		it('should set value', function(done) {
			var sets = 0;
			var client = {
				set: function(key, value, callback) {
					sets++;
					key.should.equal('foo');
					value.should.equal('{"foo":7}');
					callback();
				}
			};

			var cache = new caching.JsonCache(client);
			cache.set('foo', { foo: 7 }, function(err) {
				should.not.exist(err);
				sets.should.equal(1);
				done();
			});
		});

		it('should set value with ttl', function(done) {
			var sets = 0;
			var client = {
				set: function(key, value, ttl, callback) {
					sets++;
					key.should.equal('foo');
					value.should.equal('{"foo":7}');
					ttl.should.equal(9);
					callback();
				}
			};

			var cache = new caching.JsonCache(client);
			cache.set('foo', { foo: 7 }, 9, function(err) {
				should.not.exist(err);
				sets.should.equal(1);
				done();
			});
		});

		it('should get value', function(done) {
			var gets = 0;
			var client = {
				get: function(key, callback) {
					gets++;
					key.should.equal('foo');
					callback(null, '{ "foo": 7 }');
				}
			};

			var cache = new caching.JsonCache(client);
			cache.get('foo', function(err, result) {
				should.not.exist(err);
				gets.should.equal(1);
				result.should.eql({ foo: 7 });
				done();
			});
		});

		it('should handle get of value that is invalid JSON', function(done) {
			var gets = 0;
			var client = {
				get: function(key, callback) {
					gets++;
					key.should.equal('foo');
					callback(null, '{ "foo"');
				}
			};

			var cache = new caching.JsonCache(client);
			cache.get('foo', function(err, result) {
				should.exist(err);
				err.should.be.instanceOf(SyntaxError);
				should.not.exist(result);
				gets.should.equal(1);
				done();
			});
		});

		it('should return nothing if key is not in the cache', function(done) {
			var gets = 0;
			var client = {
				get: function(key, callback) {
					gets++;
					key.should.equal('foo');
					callback();
				}
			};

			var cache = new caching.JsonCache(client);
			cache.get('foo', function(err, result) {
				should.not.exist(err);
				should.not.exist(result);
				gets.should.equal(1);
				done();
			});
		});
	});

	describe('invalidation', function() {
		it('should invalidate entity with no dependents', function(done) {
			function Foo() {}
			var mapping = {
				Foo: {
					keys: function(entity) {
						entity.should.be.instanceOf(Foo);
						maps++;
						return [ 'foobarbaz' ];
					}
				}
			};

			var invalidates = 0;
			var maps = 0;
			var client = {
				invalidate: function(key, callback) {
					invalidates++;
					key.should.equal('foobarbaz');
					callback();
				}
			};

			var invalidator = new caching.CacheInvalidator(mapping, client);
			invalidator.invalidate(new Foo(), function(err, result) {
				should.not.exist(err);
				result.should.have.property('invalidated', true);
				invalidates.should.equal(1);
				maps.should.equal(1);
				done();
			});
		});

		it('should invalidate entity with dependents', function(done) {
			function Foo() {}
			function Bar() {}
			function Baz() {}

			var mapping = {
				Foo: {
					keys: function(entity) {
						entity.should.be.instanceOf(Foo);
						fooKeys++;
						return [ 'foo' ];
					},

					dependents: [ 'Bar', 'Baz' ]
				},

				Bar: {
					keys: function(entity) {
						entity.should.be.instanceOf(Foo);
						barKeys++;
						return [ 'bar' ];
					},
					dependents: [ 'Baz' ]
				},

				Baz: {
					keys: function(entity) {
						entity.should.be.instanceOf(Foo);
						bazKeys++;
						return [ 'baz' ];
					}
				}
			};

			var invalidated = [];
			var fooKeys = 0,
				barKeys = 0,
				bazKeys = 0;

			var client = {
				invalidate: function(key, callback) {
					invalidated.push(key);
					callback();
				}
			};

			var invalidator = new caching.CacheInvalidator(mapping, client);
			invalidator.invalidate(new Foo(), function(err, result) {
				should.not.exist(err);
				result.should.have.property('invalidated', true);
				invalidated.should.have.length(3);
				invalidated.should.containEql('foo');
				invalidated.should.containEql('bar');
				invalidated.should.containEql('baz');

				fooKeys.should.equal(1);
				barKeys.should.equal(1);
				bazKeys.should.equal(2);
				done();
			});
		});

		it('should invalidate multiple keys for entity', function(done) {
			function Foo() {}

			var mapping = {
				Foo: {
					keys: function(entity) {
						entity.should.be.instanceOf(Foo);
						maps++;
						return [ 'foo', 'bar' ];
					}
				}
			};

			var invalidates = 0;
			var maps = 0;
			var client = {
				invalidate: function(key, callback) {
					invalidates++;
					key.should.equal(invalidates === 1 ? 'foo' : 'bar');
					callback();
				}
			};

			var invalidator = new caching.CacheInvalidator(mapping, client);
			invalidator.invalidate(new Foo(), function(err, result) {
				should.not.exist(err);
				result.should.have.property('invalidated', true);
				invalidates.should.equal(2);
				maps.should.equal(1);
				done();
			});
		});

		it('should handle non-mapped entity', function(done) {
			function Foo() {}

			var mapping = {};
			var invalidates = 0;
			var client = {
				invalidate: function(key, callback) {
					invalidates++;
					callback();
				}
			};

			var invalidator = new caching.CacheInvalidator(mapping, client);
			invalidator.invalidate(new Foo(), function(err, result) {
				should.not.exist(err);
				result.should.not.have.property('invalidated');
				result.should.have.property('noMapping', true);
				invalidates.should.equal(0);
				done();
			});
		});

		it('should pass arbitrary args to map function', function(done) {
			function Foo() {}

			var mapping = {
				Foo: {
					keys: function(entity, whatever) {
						entity.should.be.instanceOf(Foo);
						whatever.should.equal('whatever');
						maps++;
						return [ 'foobarbaz' ];
					}
				}
			};

			var invalidates = 0;
			var maps = 0;
			var client = {
				invalidate: function(key, callback) {
					invalidates++;
					key.should.equal('foobarbaz');

					callback();
				}
			};

			var invalidator = new caching.CacheInvalidator(mapping, client);
			invalidator.invalidate(new Foo(), 'whatever', function(err, result) {
				should.not.exist(err);
				result.should.have.property('invalidated', true);
				invalidates.should.equal(1);
				maps.should.equal(1);
				done();
			});
		});
	});
});