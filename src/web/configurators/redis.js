module.exports = function(container, libs) {
	var cfg = container.resolveSync('Config').redis,
		log = container.resolveSync('Logger'),
		redis = libs.redis,
		lifetime = libs.sahara.lifetime;

	var client = redis.createClient({
		host: cfg.host,
		port: cfg.port
	});


	// redis error handling is just fucking embarrassing:
	// apparently this catches ALL errors, not just errors emitted by
	// redis. WHAT THE FUCK.
//	client.on('error', function(err) {
//		log.error('Redis error', err);
//	});

	container.registerInstance(client, 'RedisClient', lifetime.memory());
};