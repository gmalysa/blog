/**
 * Library functions for creating, editing, and updating posts
 */

var fl = require('flux-link');
var db = require('db-filters');
var slugify = require('slugify');

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct',
'Nov', 'Dec'];

/**
 * Synchronous information for decoding the posted field into day/month/year fields
 * @param[in] post A post database record
 * @return Modified post database record
 */
function decodeDate(post) {
	post.month = months[post.posted.getMonth()];
	post.day = post.posted.getDate();
	post.year = post.posted.getFullYear();
	post.url = ['/', post.year, '/', post.posted.getMonth()+1, '/', post.slug].join('');
	return post;
}

/**
 * Find a specific post by ID
 */
var getById = new fl.Chain(
	function(env, after, id) {
		env.filters.posts.select({id : id}).exec(after, env.$throw);
	},
	function(env, after, posts) {
		if (posts.length > 0)
			after(decodeDate(posts[0]));
		else
			after({});
	}
).use_local_env(true);

/**
 * Find a specific post by slug name, as an exact match
 * @throws If a post does not match the given slug
 */
var getBySlug = new fl.Chain(
	function(env, after, slug) {
		env.slug = slug;
		env.filters.posts.select({slug : slug}).exec(after, env.$throw);
	},
	function(env, after, posts) {
		if (posts.length > 0) {
			after(decodeDate(posts[0]));
		}
		else {
			env.$throw(new Error('There were no posts with the name '+env.slug));
		}
	}
).use_local_env(true);

/**
 * Get a list of posts in order with some offset and number of posts
 */
var getList = new fl.Chain(
	function(env, after, start, count) {
		env.filters.posts.select({})
			.order(db.$desc('posted'))
			.limit([start, count])
			.exec(after, env.$throw);
	},
	function(env, after, posts) {
		posts.map(decodeDate);
		after(posts);
	}
).use_local_env(true);

/**
 * Get the most popular posts by view count
 */
var getPopular = new fl.Chain(
	function(env, after, count) {
		env.filters.posts.select({})
			.order(db.$desc('views'))
			.limit(count)
			.exec(after, env.$throw);
	},
	function(env, after, posts) {
		posts.map(decodeDate);
		after(posts);
	}
);

/**
 * Create or edit a post in the database
 * @param[in] post The post to create or update
 */
var createOrUpdate = new fl.Chain(
	new fl.Branch(
		function(env, after, post) {
			env.post = post;
			after(env.post.id > 0);
		},
		new fl.Chain(
			function(env, after) {
				env.filters.posts.update(env.post, {id : env.post.id})
					.exec(after, env.$throw);
			},
			function(env, after) {
				after(env.post.id);
			}
		),
		new fl.Chain(
			function(env, after) {
				env.filters.posts.insert({
					posted : db.$now(),
					title : env.post.title,
					slug : slugify(env.post.title.toLowerCase()),
					content : env.post.content
				}).exec(after, env.$throw);
			},
			function(env, after, result) {
				after(result.insertId);
			}
		)
	),
	getById
);

/**
 * Increment view counter for a single post
 */
var addView = new fl.Chain(
	function(env, after, post) {
		env.filters.posts.update(
			{views : db.$add(1)},
			{id : post.id}
		).exec(after, env.$throw);
	}
);

/**
 * Get the total number of posts
 */
var getTotal = new fl.Chain(
	function(env, after) {
		env.filters.posts.select({}).fields([db.$count('id'), 'count']).exec(after, env.$throw);
	},
	function(env, after, results) {
		after(results[0].count);
	}
);

module.exports = {
	getById : getById,
	getBySlug : getBySlug,
	getList : getList,
	getPopular : getPopular,
	getTotal : getTotal,
	addView : addView,
	createOrUpdate : createOrUpdate
};
