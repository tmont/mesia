module.exports = function(container, callback) {
	var manager = container.tryResolveSync('ObjectManager');
	manager && manager.purge();
	callback();
};