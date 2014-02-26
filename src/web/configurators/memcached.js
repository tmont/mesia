module.exports = function(container, libs, next) {
	var cfg = container.resolveSync('Config').memcached,
		log = container.resolveSync('Logger'),
		Memcached = libs.memcached,
		lifetime = libs.sahara.lifetime;

	var client = new Memcached(cfg.host + ':' + cfg.port);
	client.on('issue', function(err) {
		log.warn('memcached issue', err);
	});
	client.on('failure', function(err) {
		log.error('memcached failure', err);
	});
	if (log.isDebugEnabled()) {
		client.on('reconnecting', function(details) {
			log.debug('Attempting to reconnect to memcached', details);
		});
	}
	client.on('reconnected', function(details) {
		log.info('Reconnected to memcached', details);
	});
	client.on('remove', function(details) {
		log.warn('Removing server from memcached', details);
	});

	container.registerInstance(client, 'CacheClient', lifetime.memory());
	next();
};