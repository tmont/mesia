function Repository(executor, type, validatorFactory) {
	this.executor = executor;
	this.type = type;
	this.validatorFactory = validatorFactory;
}

Repository.prototype = {
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
	}

};

module.exports = Repository;
