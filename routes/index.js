
var fs = require('fs');
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

function make_static(file, title) {
	return new fl.Chain(
		function(env, after) {
			env.$template('markdown');
			fs.readFile('static/markdown/'+file+'.md', env.$check(after));
		},
		function(env, after, content) {
			env.$output({
				title : title,
				content : content
			});
			after();
		}
	);
}

var about = make_static('about', 'About');
var projects = make_static('projects', 'Projects');
var publications = make_static('publications', 'Publications');
var contact = make_static('contact', 'Contact');

var single = new fl.Chain(
	function(env, after) {
		after(env.req.params.slug);
	},
	posts.getBySlug,
	function(env, after, post) {
		env.$template('post');
		env.$output({article : post});
		after();
	}
);

module.exports.init_routes = function(server) {
	server.add_route('/', {
		fn : index,
		pre : ['default'],
		post : ['default']
	}, 'get');

	server.add_route('/:year(\\d{4})/:month(\\d{1,2})/:slug', {
		fn : single,
		pre : ['default'],
		post : ['default']
	}, 'get');

	server.add_route('/page/:page', {
		fn : index,
		pre : ['default'],
		post : ['default']
	}, 'get');

	server.add_route('/about', {
		fn : about,
		pre : ['default'],
		post : ['default']
	}, 'get');

	server.add_route('/projects', {
		fn : projects,
		pre : ['default'],
		post : ['default']
	}, 'get');

	server.add_route('/publications', {
		fn : publications,
		pre : ['default'],
		post : ['default']
	}, 'get');

	server.add_route('/contact', {
		fn : contact,
		pre : ['default'],
		post : ['default']
	}, 'get');
};
