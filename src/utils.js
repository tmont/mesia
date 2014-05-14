var moment = require('moment-timezone');

exports.camelize = function(string) {
	return string.replace(/[-_](\w)/g, function(_, letter) {
		return letter.toUpperCase();
	});
};

exports.capitalize = function(string) {
	return string.charAt(0).toUpperCase() + string.substring(1)
};

exports.formatDate = function(date, timezone, format) {
	date = moment(date);
	if (timezone) {
		date = date.tz(timezone);
	}

	return date.format(format || 'YYYY-MM-DD hh:mm:ss');
};

exports.formatPhone = function(string) {
	return string ? '(' + string.substring(0, 3) + ') ' +
		string.substring(3, 6) + '-' + string.substring(6) : '';
};

//http://phpjs.org/functions/number_format/
exports.formatNumber = function(number, decimals, decimalPoint, thousandsSeparator) {
	// Strip all characters but numerical ones.
	number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
	var n = !isFinite(+number) ? 0 : +number,
		prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
		sep = (typeof thousandsSeparator === 'undefined') ? ',' : thousandsSeparator,
		dec = (typeof decimalPoint === 'undefined') ? '.' : decimalPoint,
		s,
		toFixedFix = function(n, prec) {
			var k = Math.pow(10, prec);
			return '' + Math.round(n * k) / k;
		};
	// Fix for IE parseFloat(0.55).toFixed(0) = 0;
	s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
	if (s[0].length > 3) {
		s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
	}
	if ((s[1] || '').length < prec) {
		s[1] = s[1] || '';
		s[1] += new Array(prec - s[1].length + 1).join('0');
	}
	return s.join(dec);
};

exports.formatMoney = function(amount) {
	return exports.formatNumber(amount, 2);
};

exports.addOrReplaceQuery = function(url, name, value) {
	function replace(url, name, value) {
		var re = new RegExp('([\\?&]' + name + '=)[^&#]*');

		var match = re.exec(url);
		if (!match) {
			var delimiter = url.indexOf('?') >= 0 ? '&' : '?';
			return url + delimiter + name + '=' + encodeURIComponent(value);
		}

		return url.replace(re, '$1' + encodeURIComponent(value));
	}

	if (Array.isArray(name)) {
		for (var i = 0; i < name.length; i++) {
			url = replace(url, name[i], Array.isArray(value) ? value[i] : value);
		}
	} else {
		url = replace(url, name, value);
	}

	return url;
};

exports.createQueryString = function(url, filters) {
	var queries = [];
	Object.keys(filters).forEach(function(key) {
		var value = filters[key] || '';
		if (Array.isArray(value)) {
			for (var i = 0; i < value.length; i++) {
				queries.push(key + '[]=' + encodeURIComponent(value[i]));
			}
		} else if (value) {
			queries.push(key + '=' + encodeURIComponent(value));
		}
	});

	if (queries.length) {
		url += '?' + queries.join('&');
	}

	return url;
};