
var fs = require('fs');
var fl = require('flux-link');

var posts = require('../lib/posts.js');
var config = require('../config.js');

const postsPerPage = 5;

/**
 * Index which also supports paginated views
 */
var index = new fl.Chain(
	function(env, after) {
		var page = parseInt(env.req.params.page);

		if (isNaN(page))
			page = 0;

		env.page = page;
		after(page * postsPerPage, postsPerPage);
	},
	posts.getList,
	function(env, after, postList) {
		env.$template('index');
		env.$output({articles : postList});
		after();
	},
	posts.getTotal,
	function(env, after, count) {
		var output = {};
		if (env.page > 0) {
			output.prev = env.page-1;
		}
		if ((env.page+1) * postsPerPage < count) {
			output.next = env.page + 1;
		}

		env.$output(output);
		after();
	}
).use_local_env(true);

/**
 * Create a chain for hosting a static page written in markdown
 * @param[in] file The name of the file to use under static/markdown
 * @param[in] title The page title to use
 * @return Chain that can be added as the route handler for this page
 */
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

// Static content
var about = make_static('about', 'About');
var projects = make_static('projects', 'Projects');
var publications = make_static('publications', 'Publications');
var contact = make_static('contact', 'Contact');

/**
 * Helper function to get the description string for a post, which is just the first paragraph
 * up to a length of 256 characters.
 */
function getDescription(text) {
	var index = text.indexOf("\r\n\r\n");

	if (index > 500)
		index = 500;

	return text.substring(0, index).replace(/\r\n/g, " ");
}

/**
 * Route for displaying a single post
 */
var single = new fl.Chain(
	function(env, after) {
		after(env.req.params.slug);
	},
	posts.getBySlug,
	function(env, after, post) {
		var desc = getDescription(post.content);
		env.$template('post');
		env.$output({article : post, description : desc});
		after(post);
	},
	posts.addView
);

/**
 * Handler for populating the recent posts, runs on every page
 */
var recent = new fl.Chain(
	function(env, after) {
		after(0, 5);
	},
	posts.getList,
	function(env, after, posts) {
		env.$output({
			recent : posts
		});
		after();
	}
);

/**
 * Handler for populating the popular posts segment, runs on every page
 */
var popular = new fl.Chain(
	function(env, after) {
		after(5);
	},
	posts.getPopular,
	function(env, after, posts) {
		env.$output({
			popular : posts
		});
		after();
	}
);

/**
 * Serve images by remapping wordpress-format urls onto the static folder
 */
var wp_image = new fl.Chain(
	function(env, after) {
		env.$raw();
		env.res.sendFile(env.req.params.filename, {
			root : __dirname + '/../' + config.static_dir + '/images/'
		}, env.$check(after));
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

	server.add_route('/wp-content/uploads/:year(\\d{4})/:month(\\d{1,2})/:filename', {
		fn : wp_image,
		pre : ['default'],
		post : ['default'],
	}, 'get');

	server.add_pre_hook(recent, 'default');
	server.add_pre_hook(popular, 'default');
};
