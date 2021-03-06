module.exports = function(key, redisConfig, next) {
	return function(container, libs) {
		var redis = libs.redis,
			lifetime = libs.sahara.lifetime;

		var client = redis.createClient(redisConfig);

		container.registerInstance(client, key || 'RedisClient', lifetime.memory());
		next();
	};
};