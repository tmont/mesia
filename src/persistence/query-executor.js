var mysql = require('mysql'),
	EventEmitter = require('events').EventEmitter,
	util = require('util');

function MySqlQueryExecutor(/** DbConnection */conn, /**Logger */log) {
	this.conn = conn;
	this.log = log;
}

util.inherits(MySqlQueryExecutor, EventEmitter);

MySqlQueryExecutor.prototype.execute = function(query, callback) {
    var self = this,
        start = Date.now();

    this.emit('querying', query);
	function queryCallback(err) {
		self.emit('queried', {
			query: query,
			elapsed: Date.now() - start
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

module.exports = MySqlQueryExecutor;
