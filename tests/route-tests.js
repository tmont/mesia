var should = require('should'),
	Route = require('../').web.Route;

describe('Route', function() {
	it('should require exact match for parameters', function() {
		var route = new Route('foo', '/:foobar');
		var url = route.getUrl({
			foo: 'foo',
			foobar: 'asdf'
		});

		url.should.equal('/asdf');
	});

	it('should require exact match for optional parameters', function() {
		var route = new Route('foo', '/:foobar?');
		var url = route.getUrl({
			foo: 'foo',
			foobar: 'asdf'
		});

		url.should.equal('/asdf');
	});

	it('should replace all matches', function() {
		var route = new Route('foo', '/:foobar/:foo/:foobar');
		var url = route.getUrl({
			foo: 'foo',
			foobar: 'asdf'
		});

		url.should.equal('/asdf/foo/asdf');
	});

	it('should remove optional route values', function() {
		var route = new Route('foo', '/foo/:foobar?');
		var url = route.getUrl();

		url.should.equal('/foo');
	});

	it('should retain required route values', function() {
		var route = new Route('foo', '/foo/:foobar');
		var url = route.getUrl();

		url.should.equal('/foo/:foobar');
	});

	it('should handle non-toString-able values', function() {
		var route = new Route('foo', '/:foo');
		var url = route.getUrl({
			foo: {
				toString: function() {
					throw new Error('NOPE.');
				}
			}
		});

		url.should.equal('/:foo');
	});
});