module.exports = (function() {
	var alreadyInitialized = false;
	return function(workers, log) {
		if (alreadyInitialized) {
			log.warn('The master has already been initialized, there is no need to run it again');
			return;
		}

		alreadyInitialized = true;

		workers = workers || require('os').cpus().length;
		var cluster = require('cluster');

		for (var i = 0; i < workers; i++) {
			cluster.fork();
		}

		if (log.isDebugEnabled()) {
			cluster.on('online', function(worker) {
				log.debug('worker ' + worker.process.pid + ' is online');
			});

			cluster.on('disconnect', function(worker) {
				log.debug('worker ' + worker.process.pid + ' has disconnected');
			});
		}

		cluster.on('exit', function(worker) {
			var causeOfDeath = worker.suicide ? 'suicide' : 'murder';
			log.error('worker ' + worker.process.pid + ' died via ' + causeOfDeath);
			cluster.fork();
		});

		log.info('Master process initialized');
	}
}());