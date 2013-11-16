module.exports = {
	createMaster: require('./master'),
	createStaticApp: require('./static-app'),
	controllerFactory: require('./controller-factory'),
	Route: require('./route'),
	configurators: require('./configurators'),
	destructors: require('./destructors'),
	middleware: require('./middleware')
};