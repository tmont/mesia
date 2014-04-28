var stringUtils = require('../../utils'),
	path = require('path'),
	async = require('async'),
	bodyParser = require('body-parser'),
	csurf = require('csurf'),
	expressSession = require('express-session'),
	cookieParser = require('cookie-parser');

module.exports = function(container, libs, next) {
	var app = container.resolveSync('App'),
		config = container.resolveSync('Config'),
		log = container.resolveSync('Logger'),
		routeLocals = container.resolveSync('RouteLocals');

	app.enable('trust proxy');
	app.enable('strict routing');
	app.enable('case sensitive routing');
	if (!config.cacheViews) {
		log.debug('disabling view cache');
		app.disable('view cache');
	} else {
		log.debug('enabling view cache');
		app.enable('view cache');
	}
	app.set('views', path.join(container.resolveSync('AppRoot'), 'views'));
	app.set('view engine', 'jade');

	//expose some locals for use in templates
	app.locals.pretty = true;
	app.locals.config = {
		staticBasePath: config.staticBasePath,
		scheme: config.scheme
	};

	app.locals.formatDate = stringUtils.formatDate;
	app.locals.formatNumber = stringUtils.formatNumber;
	app.locals.formatMoney = stringUtils.formatMoney;

	for (var local in routeLocals) {
		app.locals[local] = routeLocals[local];
	}

	//lol
	app.use(function(req, res, next) {
		res.header('X-Powered-By', 'Crystalis');
		next();
	});

	app.use(log.middleware.bind(log));

	//destruct!
	app.use(function(req, res, next) {
		log.trace('middleware: destructors');
		var destructors = container.tryResolveSync('Destructors');
		if (!destructors || !destructors.length) {
			next();
			return;
		}

		res.on('finish', function() {
			log.trace('response finished - destructing');
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
	app.use(cookieParser());
	app.use(csurf());
	app.use(bodyParser());
	app.use(expressSession({
		secret: config.session.secret,
		key: config.session.key,
		proxy: true,
		store: container.resolveSync('SessionStore')
	}));

	//set up per-request container
	app.use(require('../middleware/per-request-container')(container, libs));

	//initialize controller context
	app.use(require('../middleware/controller-context')(container, libs));

	//set up request locals for use by other middleware
	app.use(function(req, res, next) {
		log.trace('middleware: request-locals');
		var container = req.container,
			locals = {};

		locals.req = req;
		container.registerInstance(locals, 'RequestLocals');
		var userId = req.session && req.session.user && req.session.user.id;
		req.isAuthenticated = locals.isAuthenticated = !!userId;
		log.debug('isAuthenticated: ' + req.isAuthenticated + (userId ? ' (' + userId + ')' : ''));
		next();
	});

	//execute custom middleware
	app.use(function(req, res, next) {
		log.trace('middleware: app-middleware');
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

	next();
};