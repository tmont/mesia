var path = require('path'),
	util = require('util'),
	utils = require('../../utils'),
	JadeCompiler = require('../../jade-compiler'),
	async = require('async');

module.exports = function(parentContainer, libs) {
	var config = parentContainer.resolveSync('Config'),
		app = parentContainer.resolveSync('App'),
		log = parentContainer.resolveSync('Logger'),
		goa = libs.goa,
		sahara = libs.sahara;

	return function(req, res, next) {
		log.trace('middleware: controller-context');
		var jadeOptions = {
			debug: config.debugTemplates,
			pretty: true
		};
		var templateCompiler = new JadeCompiler(
			path.join(app.get('views'), 'templates'),
			jadeOptions
		);
		var partialCompiler = new JadeCompiler(
			path.join(app.get('views'), 'partials'),
			jadeOptions
		);
		var container = req.container;

		//client-side templates needed for each route
		var partials = container.tryResolveSync('ClientSidePartials') || {};

		var controllerContext = {
			config: config,
			req: req,
			res: res,
			templateCompiler: templateCompiler,
			log: log,
			redirect: function(url, send) {
				var accepts = this.req.accepts(['html', 'json']);

				switch (accepts) {
					case 'html':
						send(goa.redirect(url));
						return;
					case 'json':
						send(goa.json({ redirect: url }));
						return;
					default:
						send(goa.error(new Error('Accept must be html or json'), 406));
				}
			},
			renderError: function(status, send, errorMessage, err) {
				log.trace('rendering ' + status + ' error');
				if (err && status >= 500) {
					log.error(err);
				}

				var errorRoutes = container.tryResolveSync('ErrorRoutes'),
					route = errorRoutes && errorRoutes[status],
					viewName = route ? status.toString() : '500';

				this.doRender('errors/' + viewName, { isError: true }, route, status, send);
			},
			render: function(viewName, send, locals, goaOptions) {
				var route = container.tryResolveSync('CurrentRoute');
				this.doRender(viewName, locals || {}, route, 200, send, goaOptions);
			},

			doRender: function(viewName, locals, route, status, send, goaOptions) {
				log.trace('rendering ' + viewName, route);
				var accepts = this.req.accepts(['html', 'json']);
				locals = locals || {};
				var realLocals = container.tryResolveSync('RequestLocals') || {};
				util._extend(realLocals, locals);

				var response = {
					info: route ? route.getInfo(realLocals) : {},
					viewData: realLocals.viewData || {}
				};

				realLocals.info = response.info;

				var self = this;
				if (accepts === 'html') {
					this.res.type(accepts);
					compilePartials(function (err) {
						if (err) {
							send(goa.error(err, 500));
							return;
						}

						realLocals.partials = response.partials || {};
						goaOptions = util._extend(goaOptions || {}, {
							status: status
						});
						send(goa.view(viewName, realLocals, goaOptions));
					});
				}
				else if (accepts === 'json') {
					this.res.type(accepts);
					async.parallel([ compileTemplate, compilePartials ], function (err) {
						if (err) {
							log.error('Error rendering template', err);
							if (status < 400) {
								//render the error template
								if (err.code === 'ENOENT') {
									self.renderError(404, send, null, err);
								} else {
									self.renderError(500, send, null, err);
								}
								return;
							}

							//error rendering error template, uh oh
							response.message = 'Error rendering error';
						}

						send(goa.json(response, status));
					});
				}
				else {
					send(goa.error(new Error('Accept must be json or html'), 406));
				}

				function compilePartials(next) {
					var templates = partials[viewName];
					if (!templates || !templates.length) {
						process.nextTick(next);
						return;
					}

					response.partials = {};

					function compilePartial(partialName, next) {
						partialCompiler.compileFile(partialName, { client: true }, function(err, template) {
							if (err) {
								next(err);
								return;
							}

							var realName = utils.camelize(path.basename(partialName));
							response.partials[realName] = template.toString();
							next();
						});
					}

					async.each(templates, compilePartial, next);
				}

				function compileTemplate(next) {
					templateCompiler.compileFile(viewName, {}, function(err, template) {
						if (err) {
							next(err);
							return;
						}

						//merge in locals from app
						var locals = util._extend({}, realLocals);
						Object.keys(app.locals).forEach(function(key) {
							//fucking express
							locals[key] = app.locals[key];
						});

						try {
							response.html = template(locals);
							next();
						} catch (e) {
							log.error(e);
							next(e);
						}
					});
				}
			}
		};

		container
			.registerInstance(controllerContext, 'ControllerContext', sahara.lifetime.memory())
			.registerInstance(templateCompiler, 'TemplateCompiler', sahara.lifetime.memory());

		next();
	};
};