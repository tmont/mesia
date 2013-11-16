var formatDate = require('dateformat');

exports.camelize = function(string) {
	return string.replace(/[-_](\w)/g, function(_, letter) {
		return letter.toUpperCase();
	});
};

exports.formatDate = function(date, format) {
	return formatDate(date, format || 'yyyy-mm-dd HH:MM:ss');
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
	return '$' + exports.formatNumber(amount, 2);
};