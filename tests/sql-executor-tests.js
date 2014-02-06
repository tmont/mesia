var should = require('should'),
	mesia = require('../'),
	SqlExecutor = mesia.persistence.SqlExecutor;

describe('SQL Executor', function() {
	it('should execute string query', function(done) {
		var expectedResult = {};
		var conn = {
			query: function(query, callback) {
				query.should.equal('foo');
				callback(null, expectedResult);
			}
		};

		var log = mesia.Logger.noop;
		var executor = new SqlExecutor(conn, log, null);
		executor.execute('foo', function(err, result) {
			should.not.exist(err);
			result.should.equal(expectedResult);
			done();
		});
	});

	it('should execute parameterized query', function(done) {
		var expectedResult = {},
			expectedParams = [ 'foo', 'bar' ];
		var conn = {
			query: function(query, params, callback) {
				query.should.equal('foo');
				params.should.equal(expectedParams);
				callback(null, expectedResult);
			}
		};

		var log = mesia.Logger.noop;
		var executor = new SqlExecutor(conn, log, null);
		var query = {
			text: 'foo',
			values: expectedParams
		};
		executor.execute(query, function(err, result) {
			should.not.exist(err);
			result.should.equal(expectedResult);
			done();
		});
	});

	it('should execute toQuery()-able query', function(done) {
		var expectedResult = {},
			expectedParams = [ 'foo', 'bar' ];
		var conn = {
			query: function(query, params, callback) {
				query.should.equal('foo');
				params.should.equal(expectedParams);
				callback(null, expectedResult);
			}
		};

		var log = mesia.Logger.noop;
		var executor = new SqlExecutor(conn, log, null);
		var query = {
			toQuery: function() {
				return {
					text: 'foo',
					values: expectedParams
				};
			}
		};
		executor.execute(query, function(err, result) {
			should.not.exist(err);
			result.should.equal(expectedResult);
			done();
		});
	});

	it('should expose sql property', function() {
		var sql = {};
		var executor = new SqlExecutor({}, mesia.Logger.noop, sql);
		executor.should.have.property('sql', sql);
	});

	describe('events', function() {
		it('should emit queried with multiple results', function(done) {
			var conn = {
				query: function(query, params, callback) {
					setTimeout(function() {
						callback(null, [ 'foo', 'bar' ])
					}, 20);
				}
			};

			var log = mesia.Logger.noop;
			var executor = new SqlExecutor(conn, log, null);
			var query = { text: 'meh', _name: 'foo' };
			executor.on('queried', function(data) {
				data.should.have.property('query', query);
				data.should.have.property('name', 'foo');
				data.elapsed.should.be.greaterThan(0);
				data.should.have.property('summary', '2 rows returned');
				done();
			});
			executor.execute(query);
		});

		it('should emit queried with affected results', function(done) {
			var conn = {
				query: function(query, params, callback) {
					setTimeout(function() {
						callback(null, {
							affectedRows: 3
						})
					}, 20);
				}
			};

			var log = mesia.Logger.noop;
			var executor = new SqlExecutor(conn, log, null);
			var query = { text: 'meh', _name: 'foo' };
			executor.on('queried', function(data) {
				data.should.have.property('query', query);
				data.should.have.property('name', 'foo');
				data.elapsed.should.be.greaterThan(0);
				data.should.have.property('summary', '3 rows affected');
				done();
			});
			executor.execute(query);
		});

		it('should emit querying', function(done) {
			var conn = {
				query: function(query, params, callback) {
					callback();
				}
			};

			var log = mesia.Logger.noop;
			var executor = new SqlExecutor(conn, log, null);
			var query = { text: 'meh', _name: 'foo' };
			executor.on('querying', function(eventQuery) {
				eventQuery.should.equal(query);
				done();
			});
			executor.execute(query);
		});
	});
});