var async = require('async'),
	moment = require('moment-timezone');

function Validator() {
	this.validators = [];
}

Validator.prototype = {
	map: function(field, validator, message) {
		var self = this;
		this.validators.push(function(entity, callback) {
			if (!(field in entity)) {
				callback();
				return;
			}

			validator(entity, entity[field], function(errorMessage) {
				callback(
					errorMessage
						? self.createError(field, entity, message || (field + ' ' + errorMessage))
						: null
				);
			});
		});

		return this;
	},

	validate: function(entity, callback) {
		function validate(validator, next) {
			validator(entity, next);
		}
		async.each(this.validators, validate, callback);
	},

	createError: function(field, entity, message) {
		return new Validator.Error(field, entity, message);
	}
};

var validators = Validator.validators = {
	integer: function(entity, value, callback) {
		//http://phpjs.org/functions/is_int/
		var valid = value === +value && isFinite(value) && !(value % 1);
		callback(valid ? null : 'must be an integer');
	},

	float: function(entity, value, callback) {
		//http://phpjs.org/functions/is_float/
		var valid = value === +value && (!isFinite(value) || !!(value % 1));
		callback(valid ? null : 'must be a float');
	},

	instanceOf: function(type) {
		return function(entity, value, callback) {
			var valid = value instanceof type;
			callback(valid ? null : 'must be an instance of ' + type.name);
		};
	},

	stringLength: function(lower, upper) {
		lower = lower || 0;
		upper = upper || Infinity;

		if (lower > upper) {
			throw new Error('Lower bound cannot be greater than upper bound');
		}

		return function(entity, value, callback) {
			var valid = typeof(value) === 'string'
				&& value.length <= upper
				&& value.length >= lower;

			var message;
			if (lower === upper) {
				message = 'must be exactly ' + upper + ' characters long';
			} else {
				message = upper === Infinity
					? 'must be at least ' + lower + ' characters long'
					: 'must be between ' + lower + ' and ' + upper + ' characters long';
			}

			callback(valid ? null : message);
		};
	},

	regex: function(regex) {
		var message = 'must match regex ' + regex.toString();
		return function(entity, value, callback) {
			if (typeof(value) !== 'string') {
				callback(message);
				return;
			}

			callback(regex.test(value) ? null : message);
		};
	},

	nullable: function(validator) {
		return function(entity, value, callback) {
			if (value === null || typeof(value) === 'undefined') {
				callback();
			} else {
				validator(entity, value, callback);
			}
		};
	},

	date: function(entity, value, callback) {
		var valid = false;
		if (moment.isMoment(value)) {
			valid = value.isValid();
		} else if (value instanceof Date) {
			valid = !isNaN(value.getTime());
		}

		callback(valid ? null : 'must be a date');
	},

	required: function(entity, value, callback) {
		if (typeof(value) === 'string') {
			value = value.trim();
		}

		var valid = !!value;
		callback(valid ? null : 'is required');
	}
};

Validator.Error = function(field, entity, message) {
	this.field = field;
	this.entity = entity;
	this.message = this.validationMessage = message;
	this.isValidationError = true;
};

module.exports = Validator;