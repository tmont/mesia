var util = require('util'),
	utils = require('../utils');

function Entity() {}

Entity.prototype = {
	equals: function(other) {
		if (!('id' in this)) {
			//must override equals for entities without an "id" field
			return false;
		}

		var equal = other && this.id && other.id === this.id
			&& other instanceof this.constructor;
		return !!equal;
	}
};

Entity.inherit = function(ctor) {
	util.inherits(ctor, Entity);
	ctor.create = function(jsonOrEntity) {
		if (Array.isArray(jsonOrEntity)) {
			//to catch bonehead mistakes
			throw new Error('Cannot create entity from array');
		}

		if (jsonOrEntity instanceof ctor) {
			return jsonOrEntity;
		}

		return new ctor(jsonOrEntity);
	};

	Object.defineProperty(ctor, 'prefix', {
		value: '_' + utils.camelize(ctor.name) + '_'
	});

	if (!ctor.fromQueryResult) {
		ctor.fromQueryResult = function(data, prefix) {
			var dto = Entity.mapValues(data, prefix || ctor.prefix);
			return new ctor(dto);
		};
	}
};

Entity.mapValues = function(data, prefix) {
	prefix = prefix || '';
	var values = {};
	Object.keys(data)
		.filter(function(key) {
			return !prefix || key.indexOf(prefix) === 0;
		})
		.forEach(function(key) {
			var newKey = utils.camelize(key.substring(prefix.length));
			values[newKey] = data[key];
		});

	return values;
};

module.exports = Entity;