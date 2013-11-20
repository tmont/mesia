module.exports = {
	createMaster: require('./master'),
	controllerFactory: require('./controller-factory'),
	Route: require('./route'),
	configurators: require('./configurators'),
	destructors: require('./destructors'),
	middleware: require('./middleware')
};