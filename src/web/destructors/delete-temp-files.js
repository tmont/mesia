var async = require('async'),
	fs = require('fs');

module.exports = function(container, callback) {
	var req = container.tryResolveSync('Request'),
		log = container.resolveSync('Logger');

	if (!req.files) {
		callback();
		return;
	}

	var fileNames = Object.keys(req.files).map(function(key) {
		return req.files[key].path;
	});

	function deleteTempFile(path, next) {
		if (!path) {
			next();
			return;
		}

		log.debug('deleting temp file from upload: ' + path);
		fs.unlink(path, next);
	}

	async.each(fileNames, deleteTempFile, function(err) {
		if (err) {
			//errors aren't the end of the world, just log it and carry on
			log.error(err);
		}

		callback();
	});
};