/**
 * Create and edit posts
 */

var fl = require('flux-link');
var dust = require('dustjs-linkedin');
var slugify = require('slugify');

var posts = require('../lib/posts.js');

/**
 * Find an existing post or create a dummy variable for the rest of the page
 * @param[in] id The numerical id of a post
 * @return A post object
 */
var findOrCreate = new fl.Branch(
	function(env, after, id) {
		env.id = id;
		after(!isNaN(id));
	},
	new fl.Chain(
		function(env, after) {
			after(env.id);
		},
		posts.getById
	),
	function(env, after) {
		var post = {
			id : 0,
			title : '',
			slug : '',
			content : '',
			month : 0,
			day : 0,
			year : 0
		}
		after(post);
	}
);

/**
 * Use the edit form to either edit or create a new post
 */
var edit = new fl.Chain(
	function(env, after) {
		var id = parseInt(env.req.params.id);
		env.id = id;
		after(id);
	},
	findOrCreate,
	function(env, after, post) {
		env.$template('edit');
		env.$output({
			post : post,
			scripts : ['edit']
		});
		after();
	}
).use_local_env(true);

/**
 * Save the results of editing
 */
var save = new fl.Chain(
	function(env, after) {
		var id = parseInt(env.req.params.id);
		env.id = id;
		after({
			id : id,
			title : env.req.body.title,
			content : env.req.body.content
		});
	},
	posts.createOrUpdate,
	function(env, after, post) {
		env.$redirect(post.url);
		after();
	}
).use_local_env(true);

/**
 * To preview something run it through the dust renderer as an article and send it back
 */
var preview = new fl.Chain(
	function(env, after) {
		dust.render('article', {
		 title : env.req.body.title,
		 slug : env.req.body.slug,
		 day : 0,
		 month : 0,
		 year : 0,
		 content : env.req.body.content
		}, env.$check(after));
	},
	function(env, after, content) {
		env.$json({
			preview : content
		});
		after();
	}
);

/**
 * Generate the slug for the given title string
 */
var makeSlug = new fl.Chain(
	function(env, after) {
		env.$json({
			slug : slugify(env.req.body.title.toLowerCase())
		});
		after();
	},
);

module.exports.init_routes = function(server) {
	server.add_route('/edit', {
		fn : edit,
		pre : ['default', 'admin'],
		post : ['default']
	}, 'get');

	server.add_route('/edit/:id', {
		fn : edit,
		pre : ['default', 'admin'],
		post : ['default']
	}, 'get');

	server.add_route('/edit', {
		fn : save,
		pre : ['default', 'admin'],
		post : ['default']
	}, 'post');

	server.add_route('/edit/:id', {
		fn : save,
		pre : ['default', 'admin'],
		post : ['default']
	}, 'post');

	server.add_route('/preview', {
		fn : preview,
		pre : ['default', 'admin'],
		post : ['default']
	}, 'post');

	server.add_route('/slug', {
		fn : makeSlug,
		pre : ['default', 'admin'],
		post : ['default']
	}, 'post');
};
