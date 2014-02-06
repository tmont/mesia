var EventEmitter = require('events').EventEmitter,
	util = require('util');

/**
 * Abstraction for executing SQL queries against a database
 *
 * @param {Object} conn Database connection, should have "query" method
 * @param {Logger} log
 * @param {Object} [sql] An instance of the node-sql library, for use by a repository
 */
function SqlExecutor(/** DbConnection */conn, /**Logger */log, /** Sql */sql) {
	this.conn = conn;
	this.sql = sql;
	this.log = log;
}

util.inherits(SqlExecutor, EventEmitter);

SqlExecutor.prototype.execute = function(query, callback) {
	var self = this,
		start = Date.now(),
		name = query._name || '';

	this.emit('querying', query);
	function queryCallback(err, result) {
		var summary = '';
		if (result) {
			summary = Array.isArray(result)
				? result.length + ' row' + (result.length === 1 ? '' : 's') + ' returned'
				: result.affectedRows + ' row' + (result.affectedRows === 1 ? '' : 's') + ' affected';
		}

		self.emit('queried', {
			query: query,
			name: name,
			elapsed: Date.now() - start,
			summary: summary
		});

		if (err) {
			self.log.error(err);
		}

		callback && callback.apply(null, arguments);
	}

	var args = [ queryCallback ];

	//handle a straight-up query or a parameterized query
	if (typeof(query) !== 'string') {
		if (query.toQuery) {
			//handle a sql.select(), etc. object
			query = query.toQuery();
		}

		args.unshift(query.values);
		args.unshift(query.text);
	} else {
		args.unshift(query);
	}

	this.conn.query.apply(this.conn, args);
};

module.exports = SqlExecutor;
