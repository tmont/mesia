var should = require('should'),
	Entity = require('../').persistence.Entity;

describe('Entity', function() {
	describe('creation', function() {
		function Foo(data) {
			this.foo = data.foo;
		}
		Entity.inherit(Foo);

		it('should create object from json', function() {
			var foo = Foo.create({
				foo: 'bar'
			});

			foo.should.be.instanceOf(Foo);
			foo.should.have.property('foo', 'bar');
		});

		it('should not do anything for null', function() {
			should.not.exist(Foo.create(null));
		});

		it('should create object from instance', function() {
			var entity = new Foo({ foo: 'bar' });
			var foo = Foo.create(entity);

			foo.should.be.instanceOf(Foo);
			foo.should.have.property('foo', 'bar');
			foo.should.equal(entity);
		});

		it('should blow up if attempting to create object from array', function() {
			(function() { Foo.create([]); }).should.throwError('Cannot create entity from array');
		});

		it('should have non-writable prefix', function() {
			Foo.should.have.property('prefix', '_Foo_');
			Foo.prefix = 'bar';
			Foo.should.have.property('prefix', '_Foo_');
		});

		it('should create object from query result', function() {
			var data = {
				_Foo_foo: 'hello',
				foo: 'world'
			};

			var foo = Foo.fromQueryResult(data);
			foo.should.have.property('foo', 'hello');
		});

		it('should create object from query result with custom prefix', function() {
			var data = {
				mehfoo: 'hello',
				meh: 'world'
			};

			var foo = Foo.fromQueryResult(data, 'meh');
			foo.should.have.property('foo', 'hello');
		});
	});

	it('should map values with prefix', function() {
		var data = {
			foobarbaz: 'hello',
			foobarbat: 'world'
		};

		var values = Entity.mapValues(data, 'foobar');
		values.should.have.property('baz', 'hello');
		values.should.have.property('bat', 'world');
	});

	it('should map values with no prefix', function() {
		var data = {
			foobarbaz: 'hello',
			foobarbat: 'world'
		};

		var values = Entity.mapValues(data);
		values.should.have.property('foobarbaz', 'hello');
		values.should.have.property('foobarbat', 'world');
	});

	it('should map values and convert to camel case', function() {
		var data = {
			foo_bar: 'hello',
			foo_bar_baz: 'world'
		};

		var values = Entity.mapValues(data, 'foo_');
		values.should.have.property('bar', 'hello');
		values.should.have.property('barBaz', 'world');
	});

	describe('equality', function() {
		function Foo(id) {
			this.id = id;
		}
		Entity.inherit(Foo);

		it('should not be equal if id is not set', function() {
			var entity1 = new Foo();
			entity1.equals(entity1).should.equal(false);
		});

		it('should not be equal if they are not the same type', function() {
			var entity1 = new Foo();
			var entity2 = {};
			entity1.equals(entity2).should.equal(false);
		});

		it('should not be equal if ids do not match', function() {
			var entity1 = new Foo(5);
			var entity2 = new Foo(3);
			entity1.equals(entity2).should.equal(false);
		});

		it('should be equal if ids match', function() {
			var entity1 = new Foo(5);
			var entity2 = new Foo(5);
			entity1.equals(entity2).should.equal(true);
		});

		it('should never be equal if there is no id field', function() {
			var entity1 = new Entity();
			entity1.equals(null).should.equal(false);
		});
	});

	describe('DTO mapping', function() {
		function Foo() {
			this.hello = 'world';
			this.bar = new Bar();
			this.getDtoProperties = function() {
				return [
					'hello',
					'bar',
					{ key: 'foo', value: 'bar' },
					{ key: 'baz', value: function() { return 'lolz'; } }
				];
			};
		}

		function Bar() {
			this.id = 'bar';
			this.getDtoProperties = function() {
				return [ 'id' ];
			};
		}
		Entity.inherit(Foo);
		Entity.inherit(Bar);

		it('should map simple property', function() {
			var dto = new Foo().toDto();
			dto.should.have.property('hello', 'world');
		});

		it('should map entity', function() {
			var dto = new Foo().toDto();
			dto.bar.should.eql({ id: 'bar' });
		});

		it('should map custom key and value', function() {
			var dto = new Foo().toDto();
			dto.should.have.property('foo', 'bar');
		});

		it('should map custom key with function', function() {
			var dto = new Foo().toDto();
			dto.should.have.property('baz', 'lolz');
		});

		it('should use DTO for serialization', function() {
			var toDtoCalled = 0;
			function Foo() {
				this.toDto = function() {
					toDtoCalled++;
				};
			}

			Entity.inherit(Foo);

			new Foo().toJSON();
			toDtoCalled.should.equal(1);
		});
	});
});