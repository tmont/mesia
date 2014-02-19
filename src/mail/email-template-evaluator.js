var initTemplates = require('email-templates');

function EmailTemplateEvaluator(/** MailTemplatesDir */templatesDir) {
	this.templatesDir = templatesDir || null;
	this.tmpl = null;
}

EmailTemplateEvaluator.prototype.evaluateTemplate = function(template, locals, callback) {
	var self = this;
	if (!this.tmpl) {
		initTemplates(this.templatesDir, function(err, tmpl) {
			if (err) {
				callback(err);
				return;
			}

			self.tmpl = tmpl;
			evaluateTemplate();
		});
	} else {
		evaluateTemplate();
	}

	function evaluateTemplate() {
		self.tmpl(template, locals || {}, function(err, html, text) {
			callback(err, { text: text, html: html });
		});
	}
};

module.exports = EmailTemplateEvaluator;