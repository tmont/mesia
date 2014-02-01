var stringUtils = require('../../utils'),
	path = require('path'),
	async = require('async');

module.exports = function(container, libs) {
	var app = container.resolveSync('App'),
		config = container.resolveSync('Config'),
		log = container.resolveSync('Logger'),
		root = container.resolveSync('AppRoot'),
		routeLocals = container.resolveSync('RouteLocals'),
		sessionStore = container.resolveSync('SessionStore');

	app.enable('trust proxy');
	app.enable('strict routing');
	app.enable('case sensitive routing');
	if (!config.cacheViews) {
		app.disable('view cache');
	}
	app.set('views', path.join(root, 'views'));
	app.set('view engine', 'jade');

	//expose some locals for use in templates
	app.locals.pretty = true;
	app.locals.config = {
		host: config.host,
		staticBasePath: config.staticBasePath,
		scheme: config.scheme
	};
	for (var local in routeLocals) {
		app.locals[local] = routeLocals[local];
	}
	app.locals.formatDate = stringUtils.formatDate;
	app.locals.formatNumber = stringUtils.formatNumber;
	app.locals.formatMoney = stringUtils.formatMoney;

	if (log.isDebugEnabled()) {
		app.use(log.middleware.bind(log));
	}

	//destruct!
	app.use(function(req, res, next) {
		var destructors = container.tryResolveSync('Destructors');
		if (!destructors || !destructors.length) {
			next();
			return;
		}

		res.on('finish', function() {
			destructors = destructors.map(function(destructor) {
				return function(callback) {
					destructor(req.container, callback);
				};
			});

			async.series(destructors, function(err) {
				err && log.error('Error destructing request', err);
			});
		});

		next();
	});

	//set up default middleware
	app.use(app.express.methodOverride());
	app.use(app.express.cookieParser());
	app.use(app.express.bodyParser());
	app.use(app.express.session({
		secret: config.session.secret,
		proxy: true,
		store: sessionStore
	}));

	//set up per-request container
	app.use(require('../middleware/per-request-container')(container, libs));

	//initialize controller context
	app.use(require('../middleware/controller-context')(container, libs));

	//set up request locals for use by other middleware
	app.use(function(req, res, next) {
		req.container.registerInstance({}, 'RequestLocals');
		next();
	});

	//expose request and isAuthenticated in locals
	app.use(function(req, res, next) {
		var locals = req.container.resolveSync('RequestLocals');
		locals.req = req;
		req.isAuthenticated = locals.isAuthenticated = !!(req.session && req.session.user && req.session.user.id);
		next();
	});

	//execute custom middleware
	app.use(function(req, res, next) {
		var middleware = req.container.tryResolveSync('Middleware');
		if (!middleware || !middleware.length) {
			next();
			return;
		}

		middleware = middleware.map(function(handler) {
			return function(next) {
				handler(req, res, next);
			};
		});

		async.series(middleware, next);
	});

	//dear god, this MUST BE SECOND-TO-LAST
	app.use(app.router);

	//dear god, this MUST BE LAST!
	app.use(require('../middleware/error-handler')(container));
};