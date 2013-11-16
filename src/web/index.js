module.exports = {
	createMaster: require('./master'),
	createStaticApp: require('./static-app'),
	ControllerFactory: require('./controller-factory'),
	Route: require('./route'),
	configurators: require('./configurators'),
	destructors: require('./destructors'),
	middleware: require('./middleware')
};