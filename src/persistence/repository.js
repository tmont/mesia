var EventEmitter = require('events').EventEmitter,
	util = require('util');

function Repository(executor, type, cache, validatorFactory) {
	EventEmitter.call(this);
	this.executor = executor;
	this.type = type;
	this.cache = cache;
	this.validatorFactory = validatorFactory;
}

util.inherits(Repository, EventEmitter);

util._extend(Repository.prototype, {
	validate: function(entity, callback) {
		if (!this.validatorFactory) {
			callback();
			return;
		}

		this.validatorFactory(this.type, function(err, validator) {
			if (err || !validator) {
				callback(err);
				return;
			}

			validator.validate(entity, callback);
		});
	},

	save: function(entity, options, callback) {
		if (typeof(options) === 'function') {
			callback = options;
			options = {};
		}

		var self = this,
			isTransient = !entity.id;

		var query = !isTransient ? this.getUpdateQuery(entity) : this.getInsertQuery(entity);
		this.validate(entity, function(err) {
			if (err) {
				callback && callback(err);
				return;
			}

			self.execute(query, options, function(err, result) {
				if (err) {
					callback && callback(err);
					return;
				}

				if ('id' in entity && !entity.id && result.insertId) {
					entity.id = result.insertId;
				}

				self.emit('saved', entity);
				callback && callback(null, entity);
			});
		});
	},

	del: function(entity, options, callback) {
		this.executor.execute(this.getDeleteQuery(entity), options, callback);
	},

	load: function(id, options, callback) {
		this.executeAndCreateEntity(this.getLoadQuery(id), options, callback);
	},

	getUpdateQuery: function(entity) {
		throw new Error('Updating is not implemented yet');
	},

	getInsertQuery: function(entity) {
		throw new Error('Insertion is not implemented yet');
	},

	getDeleteQuery: function(entity) {
		throw new Error('Deletion is not implemented yet');
	},

	getLoadQuery: function(id) {
		throw new Error('Loading is not implemented yet');
	},

	createEntity: function(queryResult) {
		if (!this.type) {
			throw new Error('Repository.type is not set');
		}

		return this.type.fromQueryResult(queryResult, null);
	},

	execute: function(query, options, callback) {
		if (typeof(options) === 'function') {
			callback = options;
			options = {};
		}

		if (options.name) {
			query._name = options.name;
		}

		this.executor.execute(query, callback);
	},

	executeAndCreateEntity: function(query, options, callback) {
		if (typeof(options) === 'function') {
			callback = options;
			options = {};
		}

		var self = this;
		this.execute(query, options, function(err, results) {
			if (err) {
				callback(err);
				return;
			}

			if (!results.length) {
				callback();
				return;
			}

			callback(null, self.createEntity(results[0]));
		});
	},

	executeAndMapEntity: function(query, options, callback) {
		if (typeof(options) === 'function') {
			callback = options;
			options = {};
		}

		var self = this;
		this.execute(query, options, function(err, results) {
			if (err) {
				callback(err);
				return;
			}

			callback(null, results.map(self.createEntity.bind(self)));
		});
	},

	useCache: function(cacheKey, onMiss, onHit, ttl, done) {
		if (typeof(ttl) === 'function') {
			done = ttl;
			ttl = null;
		}

		var self = this,
			start = Date.now();
		this.cache.get(cacheKey, function(err, json) {
			var elapsed = (Date.now() - start);
			if (json) {
				self.cache.log.debug(
					'cache \x1B[32mhit\x1B[39m: \x1B[33m' + cacheKey +
					'\x1B[39m [' + elapsed + 'ms]'
				);
				onHit(json, done);
				return;
			}

			if (err) {
				self.cache.log.error(err);
			} else {
				self.cache.log.debug(
					'cache \x1B[31mmiss\x1B[39m: \x1B[33m' + cacheKey +
					'\x1B[39m [' + elapsed + 'ms]'
				);
			}

			onMiss(function(err, result) {
				if (err) {
					done(err);
					return;
				}

				var cacheable = result && typeof(result.toDto) === 'function' ? result.toDto() : result;
				self.cache.set(cacheKey, cacheable, ttl, function(err) {
					err && self.cache.log.error(err);
					done(null, result);
				});
			});
		});
	}
});

module.exports = Repository;
