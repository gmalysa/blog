
var fl = require('flux-link');

var posts = require('../lib/posts.js');

const postsPerPage = 5;

var index = new fl.Chain(
	function(env, after) {
		var page = parseInt(env.req.params.page);

		if (isNaN(page))
			page = 0;

		after(page * postsPerPage, postsPerPage);
	},
	posts.getList,
	function(env, after, postList) {
		env.$template('index');
		env.$output({articles : postList});
		after();
	}
).use_local_env(true);

module.exports.init_routes = function(server) {
	server.add_route('/', {
		fn : index,
		pre : ['default'],
		post : ['default']
	}, 'get');

	server.add_route('/page/:page', {
		fn : index,
		pre : ['default'],
		post : ['default']
	}, 'get');
};
