var EventEmitter = require('events').EventEmitter,
	async = require('async'),
	util = require('util');

require('colors');

function Repository(executor, type, cache, validatorFactory) {
	EventEmitter.call(this);
	this.executor = executor;
	this.type = type;
	this.cache = cache;
	this.validatorFactory = validatorFactory;
	this.sql = this.executor && this.executor.sql;
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
		if (typeof(options) === 'function') {
			callback = options;
			options = {};
		}

		this.execute(this.getDeleteQuery(entity), options, function(err) {
			callback && callback(err);
		});
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

			function createEntity(row, next) {
				next(null, self.createEntity(row));
			}

			//put this into the event loop so complex object mappings don't
			//block the entire app
			async.map(results, createEntity, callback);
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
			if (typeof(json) !== 'undefined') {
				self.cache.log.debug( 'cache ' + 'hit'.green + ': ' + cacheKey.yellow + ' [' + elapsed + 'ms]');
				onHit(json, done);
				return;
			}

			if (err) {
				self.cache.log.error(err);
			} else {
				self.cache.log.debug('cache ' + 'miss'.red + ': ' + cacheKey.yellow + ' [' + elapsed + 'ms]');
			}

			onMiss(function(err, result) {
				if (err) {
					done(err);
					return;
				}

				if (typeof(result) === 'undefined') {
					//make sure it's !== undefined, otherwise the redis client lib
					//will barf as it calculates arity and stuff
					result = null;
				}

				var cacheable = result && typeof(result.toFullDto) === 'function' ? result.toFullDto() : result;
				self.cache.set(cacheKey, cacheable, ttl, function(err) {
					err && self.cache.log.error(err);
					done(null, result);
				});
			});
		});
	}
});

module.exports = Repository;
