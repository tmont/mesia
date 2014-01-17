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

	save: function(entity, callback) {
		var self = this;
		var query = entity.id ? this.getUpdateQuery(entity) : this.getInsertQuery(entity);

		this.validate(entity, function(err) {
			if (err) {
				callback && callback(err);
				return;
			}

			self.executor.execute(query, function(err, result) {
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

	del: function(entity, callback) {
		this.executor.execute(this.getDeleteQuery(entity), function(err) {
			callback && callback(err);
		});
	},

	load: function(id, callback) {
		this.executeAndCreateEntity(this.getLoadQuery(id), callback);
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

	executeAndCreateEntity: function(query, callback) {
		var self = this;
		this.executor.execute(query, function(err, results) {
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

	executeAndMapEntity: function(query, callback) {
		var self = this;
		this.executor.execute(query, function(err, results) {
			if (err) {
				callback(err);
				return;
			}

			callback(null, results.map(self.createEntity.bind(self)));
		});
	}
};

module.exports = Repository;
