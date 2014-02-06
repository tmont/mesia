module.exports = {
	mariadb: require('./mariadb'),
	express: require('./express'),
	memcached: require('./memcached'),
	redis: require('./redis'),
	sqlExecutor: require('./sql-executor'),
	registerAppDirectory: require('./register-app-directory'),
	transactionInterceptor: require('./transaction-interceptor')
};