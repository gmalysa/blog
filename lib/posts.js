/**
 * Library functions for creating, editing, and updating posts
 */

var fl = require('flux-link');
var db = require('db-filters');

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct',
'Nov', 'Dec'];

/**
 * Synchronous information for decoding the posted field into day/month/year fields
 * @param[in] post A post database record
 * @return Modified post database record
 */
function decodeDate(post) {
	post.month = months[post.posted.getMonth()];
	post.day = post.posted.getDay();
	post.year = post.posted.getFullYear();
	return post;
}

/**
 * Find a specific post by slug
 */
var get = new fl.Chain(
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

module.exports = {
	getList : getList
};
