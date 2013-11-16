module.exports = (function() {
	var initialized = false;

	return function(config, cssCompiler, roots) {
		if (initialized) {
			return;
		}

		initialized = true;

		process.on('uncaughtException', function(err) {
			(log || console).error('Uncaught exception', err);
			process.exit(1);
		});

		process.on('SIGTERM', function() {
			var message = 'Received SIGTERM, exiting';
			if (log) {
				log.warn(message);
			} else {
				console.log(message);
			}
			process.exit(0);
		});

		var cluster = require('cluster'),
			path = require('path'),
			http = require('http'),
			fs = require('fs'),
			log = require('../logger').create(config.log),
			master = require('./master');

		if (config.useCluster && cluster.isMaster) {
			master.init(config.workers, log);
			return;
		}

		var start = Date.now(),
			server = http.createServer(handleRequest);

		function handleRequest(req, res) {
			log.middleware(req, res, function() {});

			function trySendNotModified(mtime) {
				var modifiedSince = parseInt(req.headers['if-modified-since']);
				if (!modifiedSince || mtime > modifiedSince) {
					return false;
				}

				res.statusCode = 304;
				res.end();
				return true;
			}

			res.on('error', function(err) {
				log.error('Error during response', err);
			});

			var urlInfo = /^\/([^/]+)\/(.+)$/.exec(req.url) || [],
				type = urlInfo[1],
				fileName = urlInfo[2].split('?')[0];

			function sendError(status, err) {
				res.statusCode = status;
				if (status >= 500 && err) {
					log.error(err);
				}

				res.end();
			}

			switch (type) {
				case 'fonts':
				case 'images':
				case 'js':
					var physicalFile = roots.shared && fileName.indexOf('shared/') === 0
						? path.join(roots.shared, type, fileName.substring('shared/'.length))
						: path.join(roots.assets, type, fileName);

					fs.exists(physicalFile, function(exists) {
						if (!exists) {
							sendError(404);
							return;
						}

						fs.stat(physicalFile, function(err, stat) {
							if (err) {
								sendError(500, err);
								return;
							}

							var mtime = stat.mtime.getTime();
							if (trySendNotModified(mtime)) {
								return;
							}

							res.setHeader('Content-Length', stat.size);
							res.setHeader('Last-Modified', mtime);

							fs.createReadStream(physicalFile).pipe(res);
						});
					});

					break;
				case 'css':
					cssCompiler.compileFile(fileName, function(err, css) {
						if (err) {
							sendError(err.code === 'ENOENT' ? 404 : 500, err);
							return;
						}

						res.setHeader('Content-Type', 'text/css');
						res.write(css);
						res.end();
					});
					break;
				default:
					sendError(404);
					break;
			}
		}

		server.listen(config.listenPort);
		log.info('Listening on localhost:' + config.listenPort);
		log.debug('app configured in ' + (Date.now() - start) + 'ms');
	}
}());
